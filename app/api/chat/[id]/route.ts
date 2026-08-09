import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import {
  deleteConversation,
  getConversation,
} from "@/features/ai/actions/chat.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await getConversation(user, id));
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
    await deleteConversation(user, id);
    return ok({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
