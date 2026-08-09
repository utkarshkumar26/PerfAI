import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { Objective, KeyResult, User } from "@prisma/client";
import type { ObjectiveInput, KeyResultInput } from "../validations/okr.schema";

export type ObjectiveWithKRs = Objective & {
  keyResults: KeyResult[];
  owner: Pick<User, "id" | "name">;
  parent: Pick<Objective, "id" | "title"> | null;
  children: Pick<Objective, "id" | "title">[];
};

export function achievementPct(objective: { keyResults: KeyResult[] }): number {
  if (objective.keyResults.length === 0) return 0;
  const sum = objective.keyResults.reduce(
    (s, kr) => s + Math.min(1, kr.current / kr.target),
    0
  );
  return Math.round((sum / objective.keyResults.length) * 100);
}

export async function listObjectives(user: User, cycle?: string) {
  const objectives = await prisma.objective.findMany({
    where: {
      ...(cycle ? { cycle } : {}),
      // Employees see own + company/team; managers see all
      ...(user.role === "EMPLOYEE"
        ? { OR: [{ ownerId: user.id }, { level: { in: ["COMPANY", "TEAM"] } }] }
        : {}),
    },
    include: {
      keyResults: true,
      owner: { select: { id: true, name: true } },
      parent: { select: { id: true, title: true } },
      children: { select: { id: true, title: true } },
    },
    orderBy: [{ level: "asc" }, { createdAt: "desc" }],
  });
  return objectives.map((o) => ({ ...o, achievement: achievementPct(o) }));
}

export async function createObjective(
  user: User,
  input: ObjectiveInput,
  keyResults: KeyResultInput[] = []
) {
  if ((input.level === "COMPANY" || input.level === "TEAM") && user.role === "EMPLOYEE") {
    throw new ApiError(403, "Only managers can create company or team objectives");
  }

  const objective = await prisma.objective.create({
    data: {
      title: input.title,
      description: input.description,
      level: input.level,
      cycle: input.cycle,
      parentId: input.parentId,
      ownerId: user.id,
      keyResults: {
        create: keyResults.map((kr) => ({
          title: kr.title,
          target: kr.target,
          unit: kr.unit,
          current: kr.current,
          ownerId: user.id,
        })),
      },
    },
    include: { keyResults: true },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "OBJECTIVE_CREATED",
      entity: "Objective",
      entityId: objective.id,
      metadata: { title: objective.title, level: objective.level },
    },
  });

  return objective;
}

function assertObjectiveAccess(user: User, ownerId: string, level: Objective["level"]) {
  const isManager = user.role === "MANAGER" || user.role === "ADMIN";
  if (user.id === ownerId) return;
  if (isManager && level !== "COMPANY") return;
  if (user.role === "ADMIN") return;
  throw new ApiError(403, "You do not have permission to modify this objective");
}

export async function updateObjective(
  user: User,
  id: string,
  input: Partial<ObjectiveInput>
) {
  const existing = await prisma.objective.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Objective not found");
  assertObjectiveAccess(user, existing.ownerId, existing.level);

  return prisma.objective.update({
    where: { id },
    data: {
      title: input.title,
      description: input.description,
      level: input.level,
      cycle: input.cycle,
      parentId: input.parentId,
    },
  });
}

export async function deleteObjective(user: User, id: string) {
  const existing = await prisma.objective.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Objective not found");
  assertObjectiveAccess(user, existing.ownerId, existing.level);
  await prisma.objective.delete({ where: { id } });
}

export async function addKeyResult(user: User, objectiveId: string, input: KeyResultInput) {
  const objective = await prisma.objective.findUnique({ where: { id: objectiveId } });
  if (!objective) throw new ApiError(404, "Objective not found");
  assertObjectiveAccess(user, objective.ownerId, objective.level);

  return prisma.keyResult.create({
    data: {
      title: input.title,
      target: input.target,
      unit: input.unit,
      current: input.current,
      objectiveId,
      ownerId: user.id,
    },
  });
}

export async function deleteKeyResult(user: User, id: string) {
  const kr = await prisma.keyResult.findUnique({
    where: { id },
    include: { objective: true },
  });
  if (!kr) throw new ApiError(404, "Key result not found");
  assertObjectiveAccess(user, kr.ownerId, kr.objective.level);
  await prisma.keyResult.delete({ where: { id } });
}

export async function updateKeyResultProgress(user: User, id: string, current: number) {
  const kr = await prisma.keyResult.findUnique({
    where: { id },
    include: { objective: true },
  });
  if (!kr) throw new ApiError(404, "Key result not found");
  assertObjectiveAccess(user, kr.ownerId, kr.objective.level);

  const updated = await prisma.keyResult.update({
    where: { id },
    data: { current: Math.max(0, current) },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "KR_PROGRESS_UPDATED",
      entity: "KeyResult",
      entityId: id,
      metadata: { current },
    },
  });

  return updated;
}

export async function listParentOptions(user: User, cycle: string, level: string) {
  const parentLevel = level === "INDIVIDUAL" ? "TEAM" : level === "TEAM" ? "COMPANY" : null;
  if (!parentLevel) return [];
  return prisma.objective.findMany({
    where: { cycle, level: parentLevel },
    select: { id: true, title: true },
    orderBy: { createdAt: "asc" },
  });
}
