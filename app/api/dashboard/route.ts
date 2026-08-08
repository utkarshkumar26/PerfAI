import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { getDashboardData } from "@/features/dashboard/actions/dashboard.service";

export async function GET() {
  try {
    const user = await requireUser();
    const data = await getDashboardData(user.id);
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}
