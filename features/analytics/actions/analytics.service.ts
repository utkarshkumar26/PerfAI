import "server-only";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  format,
  eachDayOfInterval,
  eachMonthOfInterval,
} from "date-fns";

function resolveUserId(user: User, queryUserId?: string) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  return isManager ? queryUserId ?? user.id : user.id;
}

/* ------------------------------- Weekly ------------------------------- */

export async function getWeeklyAnalytics(user: User, queryUserId?: string) {
  const userId = resolveUserId(user, queryUserId);
  const now = new Date();
  const ws = startOfWeek(now, { weekStartsOn: 1 });
  const we = endOfWeek(now, { weekStartsOn: 1 });

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

  return {
    period: `${format(ws, "MMM d")} – ${format(we, "MMM d")}`,
    assigned,
    completed,
    pending,
    blocked,
    completionRate,
    reviews,
    perDaySeries: perDay,
  };
}

/* ------------------------------- Monthly ------------------------------ */

export async function getMonthlyAnalytics(user: User, queryUserId?: string) {
  const userId = resolveUserId(user, queryUserId);
  const now = new Date();
  const ms = startOfMonth(now);
  const me = endOfMonth(now);

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

  return {
    period: format(now, "MMMM yyyy"),
    goalsAssigned,
    goalsCompleted,
    reviewsGenerated: reviews,
    avgReviewScore: avgRating._avg.rating ?? null,
    learningProgress: learningCount,
    goalsByStatus: goalByStatus.map((g) => ({ status: g.status, count: g._count._all })),
    weeklySeries,
  };
}

/* ------------------------------- Targets ------------------------------ */

export async function getTargetAnalytics(user: User, queryUserId?: string) {
  const userId = resolveUserId(user, queryUserId);
  const now = new Date();
  const ms = startOfMonth(now);
  const ws = startOfWeek(now, { weekStartsOn: 1 });
  const sixMonthsAgo = subMonths(now, 6);

  const [totalGoals, completedGoals, weeklyCompleted, monthlyCompleted, monthlyDue, ratingHistory] =
    await Promise.all([
      prisma.goal.count({ where: { userId } }),
      prisma.goal.count({ where: { userId, status: "COMPLETED" } }),
      prisma.goal.count({
        where: { userId, status: "COMPLETED", updatedAt: { gte: ws } },
      }),
      prisma.goal.count({
        where: { userId, status: "COMPLETED", updatedAt: { gte: ms } },
      }),
      prisma.goal.count({
        where: { userId, dueDate: { gte: ms, lte: endOfMonth(now) } },
      }),
      prisma.review.findMany({
        where: { userId, createdAt: { gte: sixMonthsAgo }, rating: { not: null } },
        select: { rating: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
    ]);

  const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
  const performanceTrend = months.map((m) => {
    const key = format(m, "yyyy-MM");
    const matches = ratingHistory.filter(
      (r) => format(r.createdAt, "yyyy-MM") === key
    );
    return {
      month: format(m, "MMM"),
      rating:
        matches.length === 0
          ? null
          : Number(
              (
                matches.reduce((s, r) => s + (r.rating ?? 0), 0) / matches.length
              ).toFixed(1)
            ),
    };
  });

  const remaining = Math.max(0, totalGoals - completedGoals);
  const completionPct =
    totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  return {
    totalGoals,
    completedGoals,
    remaining,
    completionPct,
    weeklyTarget: { target: weeklyCompleted + 2, completed: weeklyCompleted },
    monthlyTarget: { target: Math.max(monthlyDue, monthlyCompleted), completed: monthlyCompleted },
    performanceTrend,
    achievementRate: completionPct,
  };
}
