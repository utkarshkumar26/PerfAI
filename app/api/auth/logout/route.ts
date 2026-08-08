import { ok, handleApiError } from "@/lib/api";
import { destroySession } from "@/features/auth/actions/session";

export async function POST() {
  try {
    await destroySession();
    return ok({ message: "Logged out" });
  } catch (error) {
    return handleApiError(error);
  }
}
