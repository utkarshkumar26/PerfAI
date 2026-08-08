import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { reviewInputSchema } from "@/features/reviews/validations/review.schema";
import { saveGeneratedReview } from "@/features/reviews/actions/review.service";
import { getAIProvider, parseAIJson } from "@/services/ai/provider";
import { REVIEW_SYSTEM, reviewPrompt } from "@/features/ai/prompts";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = parseBody(reviewInputSchema, await request.json());

    const provider = getAIProvider();
    const raw = await provider.generateText(REVIEW_SYSTEM, reviewPrompt(body), {
      json: true,
      temperature: 0.4,
      maxTokens: 3000,
    });

    interface GeneratedReview {
      review: string;
      strengths: string[];
      weaknesses: string[];
      growthAreas: string[];
      rating: number;
      actionPlan: string;
    }

    const generated = parseAIJson<GeneratedReview>(raw);
    const review = await saveGeneratedReview(user, body, generated);
    return ok(review, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
