import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, handleApiError, parseBody, ApiError } from "@/lib/api";
import { requireRole } from "@/features/auth/actions/session";
import { prisma } from "@/lib/prisma";

const approvalSchema = z.object({ approved: z.boolean() });

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const manager = await requireRole("MANAGER", "ADMIN");
    const { id } = await params;
    const { approved } = parseBody(approvalSchema, await request.json());

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { user: { select: { name: true } } },
    });
    if (!goal) throw new ApiError(404, "Goal not found");

    const updated = await prisma.goal.update({ where: { id }, data: { approved } });

    await prisma.notification.create({
      data: {
        userId: goal.userId,
        type: "MANAGER_FEEDBACK",
        title: approved ? "Goal approved" : "Goal needs revision",
        message: `${manager.name} ${approved ? "approved" : "rejected"} your goal "${goal.title}".`,
        link: "/goals",
      },
    });
    await prisma.activityLog.create({
      data: {
        userId: manager.id,
        action: approved ? "GOAL_APPROVED" : "GOAL_REJECTED",
        entity: "Goal",
        entityId: goal.id,
        metadata: { title: goal.title, owner: goal.user.name },
      },
    });

    return ok(updated);
  } catch (error) {
    return handleApiError(error);
  }
}
