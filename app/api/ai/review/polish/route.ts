import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { getAIProvider } from "@/services/ai/provider";
import { enforceRateLimit } from "@/lib/rate-limit";

const polishSchema = z.object({ text: z.string().min(1).max(5000) });

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const rateLimit = await enforceRateLimit("ai-user", user.id);
    if (rateLimit) return rateLimit;

    const { text } = parseBody(polishSchema, await request.json());
    const prompt = "You polish workplace review text. Preserve the exact meaning, facts, numbers, and tone. Never invent or add information. Return only the polished text, with no quotes or explanation.";
    let polished = "";
    let lastError: unknown;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        polished = await getAIProvider().generateText(prompt, text, { temperature: 0.2, maxTokens: 800 });
        break;
      } catch (error) {
        lastError = error;
      }
    }
    if (!polished.trim()) throw lastError ?? new Error("AI polishing failed");
    return ok({ text: polished.trim() });
  } catch (error) {
    return handleApiError(error);
  }
}