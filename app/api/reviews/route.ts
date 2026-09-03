import { NextRequest } from "next/server";
import { ok, fail, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { employeeReviewSchema, reviewQuerySchema } from "@/features/reviews/validations/review.schema";
import { createEmployeeReview, listReviews } from "@/features/reviews/actions/review.service";

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = parseBody(employeeReviewSchema, await request.json());
    return ok(await createEmployeeReview(user, body), 201);
  } catch (error) {
    return handleApiError(error);
  }
}

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
