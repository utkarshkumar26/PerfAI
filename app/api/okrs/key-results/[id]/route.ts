import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import {
  deleteKeyResult,
  updateKeyResultProgress,
} from "@/features/okrs/actions/okr.service";
import { krProgressSchema } from "@/features/okrs/validations/okr.schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const { current } = parseBody(krProgressSchema, await request.json());
    return ok(await updateKeyResultProgress(user, id, current));
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
    await deleteKeyResult(user, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
