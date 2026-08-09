import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { getSuggestion } from "@/features/career/actions/career.service";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    return ok(await getSuggestion(user, id));
  } catch (error) {
    return handleApiError(error);
  }
}
