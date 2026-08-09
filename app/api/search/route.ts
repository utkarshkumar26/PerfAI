import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

/**
 * Global search across the current user's entities (RBAC-scoped):
 * goals, reviews, objectives, conversations.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const q = request.nextUrl.searchParams.get("q")?.trim();
    if (!q || q.length < 2) return ok({ goals: [], reviews: [], objectives: [], chats: [] });

    const scope = userScope(user);
    const contains = { contains: q, mode: "insensitive" as const };

    const [goals, reviews, objectives, chats] = await Promise.all([
      prisma.goal.findMany({
        where: { ...scope, OR: [{ title: contains }, { description: contains }] },
        take: 5,
        select: { id: true, title: true, status: true },
      }),
      prisma.review.findMany({
        where: { ...scope, OR: [{ content: contains }, { period: contains }] },
        take: 5,
        select: { id: true, period: true, rating: true },
      }),
      prisma.objective.findMany({
        where: {
          AND: [
            objectiveScope(user),
            { OR: [{ title: contains }, { description: contains }] },
          ],
        },
        take: 5,
        select: { id: true, title: true, level: true },
      }),
      prisma.chatHistory.findMany({
        where: { userId: user.id, OR: [{ title: contains }] },
        take: 5,
        select: { id: true, title: true },
      }),
    ]);

    return ok({
      goals: goals.map((g) => ({ ...g, href: `/goals?search=${encodeURIComponent(q)}` })),
      reviews: reviews.map((r) => ({ ...r, href: `/reviews/${r.id}` })),
      objectives: objectives.map((o) => ({ ...o, href: "/okrs" })),
      chats: chats.map((c) => ({ ...c, href: "/chat" })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

function userScope(user: User) {
  return user.role === "EMPLOYEE" ? { userId: user.id } : {};
}

function objectiveScope(user: User) {
  // Objectives: employees see their own + company/team-level ones
  return user.role === "EMPLOYEE"
    ? { OR: [{ ownerId: user.id }, { level: { in: ["COMPANY", "TEAM"] as ["COMPANY", "TEAM"] } }] }
    : {};
}
