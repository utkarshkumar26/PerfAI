import "server-only";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { User, Prisma } from "@prisma/client";
import type { CareerRequestInput } from "../validations/career.schema";

export async function listSuggestions(user: User, type?: string) {
  return prisma.careerSuggestion.findMany({
    where: { userId: user.id, ...(type ? { type } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSuggestion(user: User, id: string) {
  const suggestion = await prisma.careerSuggestion.findUnique({ where: { id } });
  if (!suggestion) throw new ApiError(404, "Suggestion not found");
  if (suggestion.userId !== user.id) throw new ApiError(403, "Access denied");
  return suggestion;
}

export async function saveSuggestion(
  user: User,
  input: CareerRequestInput,
  content: Record<string, unknown>
) {
  const summary = typeof content.summary === "string" ? content.summary : null;

  const suggestion = await prisma.careerSuggestion.create({
    data: {
      userId: user.id,
      type: input.type,
      summary,
      content: content as Prisma.InputJsonValue,
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "CAREER_SUGGESTION_GENERATED",
      entity: "CareerSuggestion",
      entityId: suggestion.id,
      metadata: { type: input.type },
    },
  });

  return suggestion;
}
