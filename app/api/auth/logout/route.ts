import { ok, handleApiError } from "@/lib/api";
import { clearSessionCookie } from "@/features/auth/actions/session";

export async function POST() {
  try {
    return clearSessionCookie(ok({ message: "Logged out" }));
  } catch (error) {
    return handleApiError(error);
  }
}
