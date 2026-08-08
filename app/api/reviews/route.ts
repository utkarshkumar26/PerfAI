import { NextRequest } from "next/server";
import { ok, fail, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { reviewQuerySchema } from "@/features/reviews/validations/review.schema";
import { listReviews } from "@/features/reviews/actions/review.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = request.nextUrl;
    const parsed = reviewQuerySchema.safeParse({
      type: searchParams.get("type") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
    });
    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten().fieldErrors);
    }
    return ok(await listReviews(user, parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}
