import { NextRequest } from "next/server";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const notification = await prisma.notification.findUnique({ where: { id } });
    if (!notification) throw new ApiError(404, "Notification not found");
    if (notification.userId !== user.id) throw new ApiError(403, "Access denied");
    const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
