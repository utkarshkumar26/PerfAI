import { NextRequest } from "next/server";
import { ok, handleApiError, ApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: [{ read: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
    return ok(notifications);
  } catch (error) {
    return handleApiError(error);
  }
}
