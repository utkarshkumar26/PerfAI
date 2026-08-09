import { NextRequest } from "next/server";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";
import { getAIProvider, parseAIJson } from "@/services/ai/provider";
import { OKR_ADVICE_SYSTEM } from "@/features/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { objectiveId } = (await request.json()) as { objectiveId?: string };
    if (!objectiveId) throw new ApiError(400, "objectiveId is required");

    const objective = await prisma.objective.findUnique({
      where: { id: objectiveId },
      include: { keyResults: true },
    });
    if (!objective) throw new ApiError(404, "Objective not found");
    if (user.role === "EMPLOYEE" && objective.ownerId !== user.id && objective.level === "INDIVIDUAL") {
      throw new ApiError(403, "Access denied");
    }

    const provider = getAIProvider();
    const raw = await provider.generateText(
      OKR_ADVICE_SYSTEM,
      `Objective: ${objective.title} (${objective.level}, cycle ${objective.cycle})\nKey results:\n` +
        objective.keyResults
          .map((kr) => `- ${kr.title}: ${kr.current}/${kr.target} ${kr.unit ?? ""}`)
          .join("\n"),
      { json: true, temperature: 0.5, maxTokens: 800 }
    );

    const advice = parseAIJson<{ recommendations: string[]; health: string }>(raw);
    return ok(advice);
  } catch (error) {
    return handleApiError(error);
  }
}
