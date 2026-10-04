import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import {
  analyticsCacheKey,
  readAnalyticsCache,
  writeAnalyticsCache,
} from "./analytics-cache";
import type { User, Prisma } from "@prisma/client";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  format,
  eachDayOfInterval,
} from "date-fns";

interface WeeklyAnalyticsResult {
  period: string;
  assigned: number;
  completed: number;
  pending: number;
  blocked: number;
  completionRate: number;
  reviews: number;
  perDaySeries: { day: string; completed: number }[];
}

interface MonthlyAnalyticsResult {
  period: string;
  goalsAssigned: number;
  goalsCompleted: number;
  reviewsGenerated: number;
  avgReviewScore: number | null;
  learningProgress: number;
  goalsByStatus: { status: string; count: number }[];
  weeklySeries: { week: string; completed: number }[];
}

async function resolveUserFilter(
  user: User,
  queryUserId?: string
): Promise<Prisma.StringFilter | string> {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  if (!isManager || !queryUserId) {
    return user.id;
  }
  if (queryUserId === "ALL") {
    const whereUser: Prisma.UserWhereInput =
      user.role === "MANAGER" ? { managerId: user.id } : { id: { not: user.id } };
    const team = await prisma.user.findMany({
      where: whereUser,
      select: { id: true },
    });
    const ids = team.map((t) => t.id);
    return { in: ids };
  }
  if (user.role === "MANAGER") {
    const report = await prisma.user.findFirst({
      where: { id: queryUserId, managerId: user.id },
      select: { id: true },
    });
    if (!report) throw new ApiError(403, "You do not have access to this employee's analytics");
  }
  return queryUserId;
}

/* ------------------------------- Weekly ------------------------------- */

export async function getWeeklyAnalytics(
  user: User,
  queryUserId?: string
): Promise<WeeklyAnalyticsResult> {
  const userId = await resolveUserFilter(user, queryUserId);
  const now = new Date();
  const ws = startOfWeek(now, { weekStartsOn: 1 });
  const we = endOfWeek(now, { weekStartsOn: 1 });

  const cacheKey = analyticsCacheKey([
    "weekly",
    user.id,
    user.role,
    queryUserId ?? "self",
    format(ws, "yyyy-MM-dd"),
  ]);
  const cached = await readAnalyticsCache<WeeklyAnalyticsResult>(cacheKey);
  if (cached !== undefined) return cached;

  const [assigned, completed, pending, blocked, reviews] = await Promise.all([
    prisma.goal.count({ where: { userId, createdAt: { gte: ws, lte: we } } }),
    prisma.goal.count({
      where: { userId, status: "COMPLETED", updatedAt: { gte: ws, lte: we } },
    }),
    prisma.goal.count({ where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } } }),
    prisma.goal.count({ where: { userId, status: "BLOCKED" } }),
    prisma.review.count({ where: { userId, createdAt: { gte: ws, lte: we } } }),
  ]);

  const days = eachDayOfInterval({ start: ws, end: now });
  const completions = await prisma.goal.findMany({
    where: { userId, status: "COMPLETED", updatedAt: { gte: ws, lte: we } },
    select: { updatedAt: true },
  });
  const perDay = days.map((d) => ({
    day: format(d, "EEE"),
    completed: completions.filter(
      (g) => format(g.updatedAt, "yyyy-MM-dd") === format(d, "yyyy-MM-dd")
    ).length,
  }));

  const completionRate =
    assigned + pending === 0 ? 0 : Math.round((completed / (assigned + pending)) * 100);

  const result = {
    period: `${format(ws, "MMM d")} – ${format(we, "MMM d")}`,
    assigned,
    completed,
    pending,
    blocked,
    completionRate,
    reviews,
    perDaySeries: perDay,
  };
  await writeAnalyticsCache(cacheKey, 30, result);
  return result;
}

/* ------------------------------- Monthly ------------------------------ */

export async function getMonthlyAnalytics(
  user: User,
  queryUserId?: string
): Promise<MonthlyAnalyticsResult> {
  const userId = await resolveUserFilter(user, queryUserId);
  const now = new Date();
  const ms = startOfMonth(now);
  const me = endOfMonth(now);

  const cacheKey = analyticsCacheKey([
    "monthly",
    user.id,
    user.role,
    queryUserId ?? "self",
    format(ms, "yyyy-MM"),
  ]);
  const cached = await readAnalyticsCache<MonthlyAnalyticsResult>(cacheKey);
  if (cached !== undefined) return cached;

  const [goalsAssigned, goalsCompleted, reviews, avgRating, learningCount, goalByStatus] =
    await Promise.all([
      prisma.goal.count({ where: { userId, createdAt: { gte: ms, lte: me } } }),
      prisma.goal.count({
        where: { userId, status: "COMPLETED", updatedAt: { gte: ms, lte: me } },
      }),
      prisma.review.count({ where: { userId, createdAt: { gte: ms, lte: me } } }),
      prisma.review.aggregate({
        where: { userId, createdAt: { gte: ms, lte: me }, rating: { not: null } },
        _avg: { rating: true },
      }),
      prisma.careerSuggestion.count({ where: { userId, createdAt: { gte: ms, lte: me } } }),
      prisma.goal.groupBy({
        by: ["status"],
        where: { userId },
        _count: { _all: true },
      }),
    ]);

  // Weekly buckets within the month
  const weekStarts: Date[] = [];
  let cursor = startOfWeek(ms, { weekStartsOn: 1 });
  while (cursor <= me) {
    weekStarts.push(cursor);
    cursor = startOfWeek(subWeeks(cursor, -1), { weekStartsOn: 1 });
  }
  const completedGoals = await prisma.goal.findMany({
    where: { userId, status: "COMPLETED", updatedAt: { gte: ms, lte: me } },
    select: { updatedAt: true },
  });
  const weeklySeries = weekStarts.map((start, i) => {
    const end = i === weekStarts.length - 1 ? me : subWeeks(weekStarts[i + 1], 0);
    const next = weekStarts[i + 1];
    return {
      week: `W${i + 1}`,
      completed: completedGoals.filter((g) =>
        next ? g.updatedAt >= start && g.updatedAt < next : g.updatedAt >= start && g.updatedAt <= end
      ).length,
    };
  });

  const result = {
    period: format(now, "MMMM yyyy"),
    goalsAssigned,
    goalsCompleted,
    reviewsGenerated: reviews,
    avgReviewScore: avgRating._avg.rating ?? null,
    learningProgress: learningCount,
    goalsByStatus: goalByStatus.map((g) => ({ status: g.status, count: g._count._all })),
    weeklySeries,
  };
  await writeAnalyticsCache(cacheKey, 60, result);
  return result;
}
