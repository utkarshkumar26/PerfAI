import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import {
  deleteObjective,
  updateObjective,
} from "@/features/okrs/actions/okr.service";
import { objectiveSchema } from "@/features/okrs/validations/okr.schema";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = parseBody(objectiveSchema.partial(), await request.json());
    return ok(await updateObjective(user, id, body));
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
    await deleteObjective(user, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
