import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { updateReviewSchema } from "@/features/reviews/validations/review.schema";
import {
  deleteReview,
  getReview,
  updateReview,
} from "@/features/reviews/actions/review.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await getReview(user, id));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = parseBody(updateReviewSchema, await request.json());
    return ok(await updateReview(user, id, body));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await deleteReview(user, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
