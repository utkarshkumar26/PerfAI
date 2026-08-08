import { ok, handleApiError } from "@/lib/api";
import { getSessionUser } from "@/features/auth/actions/session";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) return ok({ user: null });
    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        designation: user.designation,
        departmentId: user.departmentId,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
