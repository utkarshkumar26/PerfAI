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

function generateTaskNumber(): string {
  const num = Math.floor(100000000 + Math.random() * 900000000);
  return `T${num}`;
}

function scopeToRole(user: User, query: GoalQuery) {
  // Employees can only see their own tasks. Managers can see all or filter by userId.
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
    ...(query.section ? { section: query.section } : {}),
    ...(query.project ? { project: query.project } : {}),
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
            { taskNumber: { contains: query.search, mode: "insensitive" } },
            { reproSteps: { contains: query.search, mode: "insensitive" } },
            { sectionOrTab: { contains: query.search, mode: "insensitive" } },
            { project: { contains: query.search, mode: "insensitive" } },
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
        user: { select: { id: true, name: true, avatarUrl: true, designation: true, email: true } },
        assignedBy: { select: { id: true, name: true, avatarUrl: true } },
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
      user: { select: { id: true, name: true, avatarUrl: true, designation: true, email: true } },
      assignedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  });
  if (!goal) throw new ApiError(404, "Task not found");
  assertCanView(user, goal.userId);
  return goal;
}

export async function createGoal(user: User, input: CreateGoalInput) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  let ownerId = user.id;
  let assignedById: string | null = null;

  if (input.userId && input.userId !== user.id) {
    ownerId = input.userId;
    assignedById = user.id;
  }

  const taskNumber = input.taskNumber || generateTaskNumber();

  const goal = await prisma.goal.create({
    data: {
      taskNumber,
      title: input.title,
      description: input.description,
      priority: input.priority,
      status: input.status,
      category: input.category,
      dueDate: input.dueDate,
      startDate: input.startDate || new Date(),
      progress: input.progress,
      notes: input.notes,
      section: input.section || "ASSIGNED",
      project: input.project || "Wipro Build People",
      size: input.size || "M",
      sprint: input.sprint || "Sprint 42",
      owningTeam: input.owningTeam || "Wipro Build People",
      bugType: input.bugType,
      sectionOrTab: input.sectionOrTab,
      descriptionIfOther: input.descriptionIfOther,
      reproSteps: input.reproSteps,
      expectedResult: input.expectedResult,
      actualResult: input.actualResult,
      debugInfo: input.debugInfo as Prisma.InputJsonValue ?? Prisma.JsonNull,
      comments: input.comments as Prisma.InputJsonValue ?? [],
      starred: input.starred ?? false,
      userId: ownerId,
      assignedById,
      approved: !assignedById, // self-created tasks are auto-approved
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, designation: true, email: true } },
      assignedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "TASK_CREATED",
      entity: "Goal",
      entityId: goal.id,
      metadata: { title: goal.title, taskNumber },
    },
  });

  if (assignedById && ownerId !== user.id) {
    await prisma.notification.create({
      data: {
        userId: ownerId,
        type: "MANAGER_FEEDBACK",
        title: "New task assigned",
        message: `${user.name} assigned you the task "${goal.title}"`,
        link: `/tasks`,
      },
    });
  }

  return goal;
}

function assertCanView(user: User, ownerId: string) {
  if (user.role === "EMPLOYEE" && user.id !== ownerId) {
    throw new ApiError(403, "You do not have access to this task");
  }
}

function assertCanModify(user: User, ownerId: string, assignedById: string | null) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  const isOwner = user.id === ownerId;
  const isAssigner = assignedById === user.id;
  if (!isOwner && !(isManager && (isAssigner || user.role === "ADMIN" || user.role === "MANAGER"))) {
    throw new ApiError(403, "You do not have permission to modify this task");
  }
}

export async function updateGoal(user: User, id: string, input: UpdateGoalInput) {
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Task not found");
  assertCanModify(user, existing.userId, existing.assignedById);

  // Only managers/admins may change approval status.
  if (input.approved !== undefined && user.role === ("EMPLOYEE" satisfies Role)) {
    throw new ApiError(403, "Only managers can approve or reject tasks");
  }

  const wasCompleted = existing.status === "COMPLETED";
  const willComplete = input.status === "COMPLETED";

  let updatedComments = existing.comments as Array<{
    id: string;
    userId: string;
    userName: string;
    userAvatar?: string | null;
    text: string;
    createdAt: string;
  }> | null;

  if (!Array.isArray(updatedComments)) {
    updatedComments = [];
  }

  if (input.comment && input.comment.text.trim()) {
    updatedComments.push({
      id: `c_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      userId: user.id,
      userName: user.name,
      userAvatar: user.avatarUrl,
      text: input.comment.text.trim(),
      createdAt: new Date().toISOString(),
    });
  }

  const newUserId = input.userId || existing.userId;
  const newAssignedById =
    input.userId && input.userId !== existing.userId ? user.id : existing.assignedById;

  const goal = await prisma.goal.update({
    where: { id },
    data: {
      title: input.title !== undefined ? input.title : existing.title,
      description: input.description !== undefined ? input.description : existing.description,
      priority: input.priority !== undefined ? input.priority : existing.priority,
      status: input.status !== undefined ? input.status : existing.status,
      category: input.category !== undefined ? input.category : existing.category,
      dueDate: input.dueDate !== undefined ? input.dueDate : existing.dueDate,
      startDate: input.startDate !== undefined ? input.startDate : existing.startDate,
      progress: willComplete ? 100 : (input.progress !== undefined ? input.progress : existing.progress),
      notes: input.notes !== undefined ? input.notes : existing.notes,
      approved: input.approved !== undefined ? input.approved : existing.approved,
      section: input.section !== undefined ? input.section : existing.section,
      project: input.project !== undefined ? input.project : existing.project,
      size: input.size !== undefined ? input.size : existing.size,
      sprint: input.sprint !== undefined ? input.sprint : existing.sprint,
      owningTeam: input.owningTeam !== undefined ? input.owningTeam : existing.owningTeam,
      bugType: input.bugType !== undefined ? input.bugType : existing.bugType,
      sectionOrTab: input.sectionOrTab !== undefined ? input.sectionOrTab : existing.sectionOrTab,
      descriptionIfOther: input.descriptionIfOther !== undefined ? input.descriptionIfOther : existing.descriptionIfOther,
      reproSteps: input.reproSteps !== undefined ? input.reproSteps : existing.reproSteps,
      expectedResult: input.expectedResult !== undefined ? input.expectedResult : existing.expectedResult,
      actualResult: input.actualResult !== undefined ? input.actualResult : existing.actualResult,
      debugInfo:
        input.debugInfo !== undefined
          ? input.debugInfo === null
            ? Prisma.DbNull
            : (input.debugInfo as Prisma.InputJsonValue)
          : existing.debugInfo === null
          ? Prisma.DbNull
          : (existing.debugInfo as Prisma.InputJsonValue),
      comments: (updatedComments as unknown as Prisma.InputJsonValue) ?? [],
      starred: input.starred !== undefined ? input.starred : existing.starred,
      userId: newUserId,
      assignedById: newAssignedById,
    },
    include: {
      user: { select: { id: true, name: true, avatarUrl: true, designation: true, email: true } },
      assignedBy: { select: { id: true, name: true, avatarUrl: true } },
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: willComplete && !wasCompleted ? "TASK_COMPLETED" : "TASK_UPDATED",
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
        title: "Task completed",
        message: `"${goal.title}" has been marked complete.`,
        link: `/tasks`,
      },
    });
    if (existing.assignedById) {
      await prisma.notification.create({
        data: {
          userId: existing.assignedById,
          type: "GOAL_COMPLETED",
          title: "Assigned task completed",
          message: `A task you assigned was completed: "${goal.title}"`,
          link: `/tasks`,
        },
      });
    }
  }

  return goal;
}

export async function deleteGoal(user: User, id: string) {
  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Task not found");
  assertCanModify(user, existing.userId, existing.assignedById);

  await prisma.goal.delete({ where: { id } });
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "TASK_DELETED",
      entity: "Goal",
      entityId: id,
      metadata: { title: existing.title },
    },
  });
}

