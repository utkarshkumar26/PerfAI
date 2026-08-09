import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import {
  getSuggestion,
  listSuggestions,
} from "@/features/career/actions/career.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const type = request.nextUrl.searchParams.get("type") ?? undefined;
    return ok(await listSuggestions(user, type));
  } catch (error) {
    return handleApiError(error);
  }
}
