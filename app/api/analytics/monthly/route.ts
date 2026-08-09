import { NextRequest } from "next/server";
import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { getMonthlyAnalytics } from "@/features/analytics/actions/analytics.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const userId = request.nextUrl.searchParams.get("userId") ?? undefined;
    return ok(await getMonthlyAnalytics(user, userId));
  } catch (error) {
    return handleApiError(error);
  }
}
