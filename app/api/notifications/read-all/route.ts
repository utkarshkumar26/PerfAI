import { ok, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const user = await requireUser();
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return ok({ updated: true });
  } catch (error) {
    return handleApiError(error);
  }
}
