import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { careerRequestSchema } from "@/features/career/validations/career.schema";
import { saveSuggestion } from "@/features/career/actions/career.service";
import { getAIProvider, parseAIJson } from "@/services/ai/provider";
import { CAREER_SYSTEM, careerPrompt } from "@/features/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = parseBody(careerRequestSchema, await request.json());

    const provider = getAIProvider();
    const raw = await provider.generateText(CAREER_SYSTEM, careerPrompt(body), {
      json: true,
      temperature: 0.6,
      maxTokens: 3000,
    });

    const content = parseAIJson<Record<string, unknown>>(raw);
    const suggestion = await saveSuggestion(user, body, content);
    return ok(suggestion, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
