import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { updateGoalSchema } from "@/features/goals/validations/goal.schema";
import {
  deleteGoal,
  getGoal,
  updateGoal,
} from "@/features/goals/actions/goal.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await getGoal(user, id));
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
    const body = parseBody(updateGoalSchema, await request.json());
    return ok(await updateGoal(user, id, body));
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
    await deleteGoal(user, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
