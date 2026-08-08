import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { aiGoalSuggestionSchema } from "@/features/goals/validations/goal.schema";
import { getAIProvider, parseAIJson } from "@/services/ai/provider";
import { GOALS_SYSTEM, goalSuggestionsPrompt } from "@/features/ai/prompts";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = parseBody(aiGoalSuggestionSchema, await request.json());

    const provider = getAIProvider();
    const raw = await provider.generateText(
      GOALS_SYSTEM,
      goalSuggestionsPrompt(body),
      { json: true, temperature: 0.6, maxTokens: 3000 }
    );

    interface AISuggestions {
      goals: Array<{
        title: string;
        description: string;
        priority: "LOW" | "MEDIUM" | "HIGH";
        category: string;
        timelineDays: number;
      }>;
      weeklyTasks: string[];
      monthlyTasks: string[];
      learningPlan: string[];
      certifications: string[];
      summary: string;
    }

    const suggestions = parseAIJson<AISuggestions>(raw);

    await prisma.careerSuggestion.create({
      data: {
        userId: user.id,
        type: "GOALS",
        summary: suggestions.summary,
        content: JSON.parse(JSON.stringify(suggestions)),
      },
    });

    return ok(suggestions);
  } catch (error) {
    return handleApiError(error);
  }
}
