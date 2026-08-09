import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { User, Prisma } from "@prisma/client";
import { startOfMonth, subMonths, format, eachMonthOfInterval } from "date-fns";

export async function listEmployees(
  manager: User,
  q: { search?: string; departmentId?: string; page: number; pageSize: number; skip: number }
) {
  if (manager.role !== "MANAGER" && manager.role !== "ADMIN") {
    throw new ApiError(403, "Managers only");
  }

  const where: Prisma.UserWhereInput = {
    id: { not: manager.id },
    ...(manager.role === "MANAGER" ? { managerId: manager.id } : {}),
    ...(q.departmentId ? { departmentId: q.departmentId } : {}),
    ...(q.search
      ? {
          OR: [
            { name: { contains: q.search, mode: "insensitive" } },
            { email: { contains: q.search, mode: "insensitive" } },
            { designation: { contains: q.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: q.skip,
      take: q.pageSize,
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        designation: true,
        role: true,
        skills: true,
        department: { select: { id: true, name: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const ids = users.map((u) => u.id);
  const [goalCounts, ratings] = await Promise.all([
    prisma.goal.groupBy({
      by: ["userId", "status"],
      where: { userId: { in: ids } },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ["userId"],
      where: { userId: { in: ids }, rating: { not: null } },
      _avg: { rating: true },
    }),
  ]);

  const ratingByUser = new Map(ratings.map((r) => [r.userId, r._avg.rating]));
  const employees = users.map((u) => {
    const rows = goalCounts.filter((g) => g.userId === u.id);
    const completed = rows.find((r) => r.status === "COMPLETED")?._count._all ?? 0;
    const totalGoals = rows.reduce((s, r) => s + r._count._all, 0);
    return {
      ...u,
      totalGoals,
      completedGoals: completed,
      completionPct: totalGoals === 0 ? 0 : Math.round((completed / totalGoals) * 100),
      avgRating: ratingByUser.get(u.id) ?? null,
    };
  });

  return {
    employees,
    pagination: {
      page: q.page,
      pageSize: q.pageSize,
      total,
      totalPages: Math.ceil(total / q.pageSize),
    },
  };
}

export async function getTeamAnalytics(manager: User) {
  const whereUser: Prisma.UserWhereInput =
    manager.role === "MANAGER" ? { managerId: manager.id } : {};
  if (manager.role === "EMPLOYEE") throw new ApiError(403, "Managers only");

  const now = new Date();
  const sixMonthsAgo = subMonths(now, 6);
  const ms = startOfMonth(now);

  const team = await prisma.user.findMany({
    where: { ...whereUser, id: { not: manager.id } },
    select: { id: true, name: true, skills: true, department: { select: { name: true } } },
  });
  const ids = team.map((t) => t.id);

  const [goalsByStatus, completionsByUser, ratingsByMonth, goalsDueThisWeek] =
    await Promise.all([
      prisma.goal.groupBy({
        by: ["status"],
        where: { userId: { in: ids } },
        _count: { _all: true },
      }),
      prisma.goal.groupBy({
        by: ["userId"],
        where: { userId: { in: ids }, status: "COMPLETED", updatedAt: { gte: ms } },
        _count: { _all: true },
      }),
      prisma.review.findMany({
        where: { userId: { in: ids }, createdAt: { gte: sixMonthsAgo }, rating: { not: null } },
        select: { userId: true, rating: true, createdAt: true },
      }),
      prisma.goal.count({
        where: {
          userId: { in: ids },
          status: { not: "COMPLETED" },
          dueDate: { lte: new Date(now.getTime() + 7 * 86400000) },
        },
      }),
    ]);

  const skillCount = new Map<string, number>();
  team.forEach((t) => t.skills.forEach((s) => skillCount.set(s, (skillCount.get(s) ?? 0) + 1)));
  const skillDistribution = [...skillCount.entries()]
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const completionsMap = new Map(completionsByUser.map((c) => [c.userId, c._count._all]));
  const ratingMap = new Map<string, { sum: number; n: number }>();
  ratingsByMonth.forEach((r) => {
    const cur = ratingMap.get(r.userId) ?? { sum: 0, n: 0 };
    ratingMap.set(r.userId, { sum: cur.sum + (r.rating ?? 0), n: cur.n + 1 });
  });

  const topPerformers = team
    .map((t) => {
      const r = ratingMap.get(t.id);
      return {
        id: t.id,
        name: t.name,
        completedThisMonth: completionsMap.get(t.id) ?? 0,
        avgRating: r && r.n > 0 ? Number((r.sum / r.n).toFixed(1)) : null,
      };
    })
    .sort(
      (a, b) =>
        (b.avgRating ?? 0) * 10 + b.completedThisMonth - ((a.avgRating ?? 0) * 10 + a.completedThisMonth)
    )
    .slice(0, 5);

  const months = eachMonthOfInterval({ start: sixMonthsAgo, end: now });
  const monthlyPerformance = months.map((m) => {
    const key = format(m, "yyyy-MM");
    const rows = ratingsByMonth.filter((r) => format(r.createdAt, "yyyy-MM") === key);
    return {
      month: format(m, "MMM"),
      avgRating: rows.length
        ? Number((rows.reduce((s, r) => s + (r.rating ?? 0), 0) / rows.length).toFixed(1))
        : null,
    };
  });

  const deptMap = new Map<string, { completed: number; total: number }>();
  const allGoals = await prisma.goal.groupBy({
    by: ["userId", "status"],
    where: { userId: { in: ids } },
    _count: { _all: true },
  });
  const userDept = new Map(team.map((t) => [t.id, t.department?.name ?? "Unassigned"]));
  allGoals.forEach((g) => {
    const dept = userDept.get(g.userId) ?? "Unassigned";
    const cur = deptMap.get(dept) ?? { completed: 0, total: 0 };
    cur.total += g._count._all;
    if (g.status === "COMPLETED") cur.completed += g._count._all;
    deptMap.set(dept, cur);
  });
  const departmentComparison = [...deptMap.entries()].map(([department, v]) => ({
    department,
    completionPct: v.total === 0 ? 0 : Math.round((v.completed / v.total) * 100),
  }));

  return {
    headcount: ids.length,
    goalsByStatus: goalsByStatus.map((g) => ({ status: g.status, count: g._count._all })),
    goalsDueThisWeek,
    skillDistribution,
    topPerformers,
    monthlyPerformance,
    departmentComparison,
  };
}
