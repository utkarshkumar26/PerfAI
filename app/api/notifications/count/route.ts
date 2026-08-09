import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const count = await prisma.notification.count({
      where: { userId: user.id, read: false },
    });
    return ok({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
