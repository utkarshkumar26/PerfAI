import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import { Prisma, Role, User } from "@prisma/client";
import type { CreateGoalInput, GoalQuery, UpdateGoalInput } from "../validations/goal.schema";

interface Page {
  skip: number;
  take: number;
  page: number;
  pageSize: number;
}

function scopeToRole(user: User, query: GoalQuery) {
  // Employees can only see their own goals. Managers may filter by userId.
  if (user.role === "EMPLOYEE") return user.id;
  return query.userId;
}

function buildWhere(user: User, query: GoalQuery): Prisma.GoalWhereInput {
  const userId = scopeToRole(user, query);
  return {
    ...(userId ? { userId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.dueAfter || query.dueBefore
      ? {
          dueDate: {
            ...(query.dueAfter ? { gte: query.dueAfter } : {}),
            ...(query.dueBefore ? { lte: query.dueBefore } : {}),
          },
        }
      : {}),
    ...(query.search
      ? {
          OR: [
            { title: { contains: query.search, mode: "insensitive" } },
            { description: { contains: query.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export async function listGoals(user: User, query: GoalQuery, page: Page) {
  const where = buildWhere(user, query);
  const [goals, total] = await Promise.all([
    prisma.goal.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortOrder },
      skip: page.skip,
      take: page.take,
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
        assignedBy: { select: { id: true, name: true } },
      },
    }),
    prisma.goal.count({ where }),
  ]);
  return {
    goals,
    pagination: {
      page: page.page,
      pageSize: page.pageSize,
      total,
      totalPages: Math.ceil(total / page.pageSize),
    },
  };
}

export async function getGoal(user: User, id: string) {
  const goal = await prisma.goal.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true } },
      assignedBy: { select: { id: true, name: true } },
    },
  });
  if (!goal) throw new ApiError(404, "Goal not found");
  assertCanView(user, goal.userId);
  return goal;
}

export async function createGoal(user: User, input: CreateGoalInput) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  let ownerId = user.id;
  let assignedById: string | null = null;

  if (input.userId && input.userId !== user.id) {
    if (!isManager) throw new ApiError(403, "Only managers can assign goals to others");
    ownerId = input.userId;
    assignedById = user.id;
  }

  const goal = await prisma.goal.create({
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      category: input.category,
      dueDate: input.dueDate,
      progress: input.progress,
      notes: input.notes,
      userId: ownerId,
      assignedById,
      approved: !assignedById, // self-created goals are auto-approved
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "GOAL_CREATED",
      entity: "Goal",
      entityId: goal.id,
      metadata: { title: goal.title },
    },
  });

  if (assignedById) {
    await prisma.notification.create({
      data: {
        userId: ownerId,
        type: "MANAGER_FEEDBACK",
        title: "New goal assigned",
        message: `${user.name} assigned you the goal "${goal.title}"`,
        link: `/goals/${goal.id}`,
      },
    });
  }

  return goal;
}

function assertCanView(user: User, ownerId: string) {
  if (user.role === "EMPLOYEE" && user.id !== ownerId) {
    throw new ApiError(403, "You do not have access to this goal");
  }
}

function assertCanModify(user: User, ownerId: string, assignedById: string | null) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  const isOwner = user.id === ownerId;
  const isAssigner = assignedById === user.id;
  if (!isOwner && !(isManager && (isAssigner || user.role === "ADMIN"))) {
    throw new ApiError(403, "You do not have permission to modify this goal");
  }
}

export async function updateGoal(user: User, id: string, input: UpdateGoalInput) {
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Goal not found");
  assertCanModify(user, existing.userId, existing.assignedById);

  // Only managers/admins may change approval status.
  if (input.approved !== undefined && user.role === ("EMPLOYEE" satisfies Role)) {
    throw new ApiError(403, "Only managers can approve or reject goals");
  }

  const wasCompleted = existing.status === "COMPLETED";
  const willComplete = input.status === "COMPLETED";

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      category: input.category,
      dueDate: input.dueDate,
      progress: willComplete ? 100 : input.progress,
      notes: input.notes,
      approved: input.approved,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: willComplete && !wasCompleted ? "GOAL_COMPLETED" : "GOAL_UPDATED",
      entity: "Goal",
      entityId: goal.id,
      metadata: { title: goal.title, status: goal.status },
    },
  });

  if (willComplete && !wasCompleted) {
    await prisma.notification.create({
      data: {
        userId: goal.userId,
        type: "GOAL_COMPLETED",
        title: "Goal completed",
        message: `"${goal.title}" has been marked complete.`,
        link: `/goals/${goal.id}`,
      },
    });
    if (existing.assignedById) {
      await prisma.notification.create({
        data: {
          userId: existing.assignedById,
          type: "GOAL_COMPLETED",
          title: "Assigned goal completed",
          message: `A goal you assigned was completed: "${goal.title}"`,
          link: `/goals/${goal.id}`,
        },
      });
    }
  }

  return goal;
}

export async function deleteGoal(user: User, id: string) {
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Goal not found");
  assertCanModify(user, existing.userId, existing.assignedById);

  await prisma.goal.delete({ where: { id } });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "GOAL_DELETED",
      entity: "Goal",
      entityId: id,
      metadata: { title: existing.title },
    },
  });
}
