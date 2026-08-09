import { ok, handleApiError } from "@/lib/api";
import { requireRole } from "@/features/auth/actions/session";
import { getTeamAnalytics } from "@/features/manager/actions/manager.service";

export async function GET() {
  try {
    const user = await requireRole("MANAGER", "ADMIN");
    return ok(await getTeamAnalytics(user));
  } catch (error) {
    return handleApiError(error);
  }
}
