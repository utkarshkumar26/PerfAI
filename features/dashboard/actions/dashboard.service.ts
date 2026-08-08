import "server-only";
import { prisma } from "@/lib/prisma";

function startOfWeek(now: Date): Date {
  const d = new Date(now);
  const day = (d.getDay() + 6) % 7; // Monday start
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfMonth(now: Date): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function getDashboardData(userId: string) {
  const now = new Date();
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    user,
    totalGoals,
    completedGoals,
    activeGoals,
    latestReview,
    avgRating,
    upcomingGoals,
    weeklyCompleted,
    monthlyCompleted,
    recentActivities,
    latestSuggestion,
  ] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, role: true, designation: true },
    }),
    prisma.goal.count({ where: { userId } }),
    prisma.goal.count({ where: { userId, status: "COMPLETED" } }),
    prisma.goal.findMany({
      where: { userId, status: { in: ["TODO", "IN_PROGRESS"] } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.review.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        period: true,
        rating: true,
        createdAt: true,
        content: true,
      },
    }),
    prisma.review.aggregate({
      where: { userId, rating: { not: null } },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.goal.findMany({
      where: {
        userId,
        status: { not: "COMPLETED" },
        dueDate: { gte: now, lte: in14Days },
      },
      orderBy: { dueDate: "asc" },
      take: 5,
      select: { id: true, title: true, dueDate: true, priority: true, progress: true },
    }),
    prisma.goal.count({
      where: { userId, status: "COMPLETED", updatedAt: { gte: weekStart } },
    }),
    prisma.goal.count({
      where: { userId, status: "COMPLETED", updatedAt: { gte: monthStart } },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.careerSuggestion.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, type: true, summary: true, createdAt: true },
    }),
  ]);

  const completionRate = totalGoals === 0 ? 0 : Math.round((completedGoals / totalGoals) * 100);

  return {
    user: { name: user.name, role: user.role, designation: user.designation },
    stats: {
      totalGoals,
      completedGoals,
      activeGoalsCount: activeGoals.length,
      completionRate,
      performanceScore: latestReview?.rating ?? avgRating._avg.rating ?? null,
      averageRating: avgRating._avg.rating ?? null,
      reviewsCount: avgRating._count.rating,
      weeklyCompleted,
      monthlyCompleted,
    },
    activeGoals,
    latestReview,
    upcomingDeadlines: upcomingGoals,
    recentActivities,
    latestSuggestion,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboardData>>;
