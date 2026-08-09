import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { profileSchema } from "@/features/profile/validations/profile.schema";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const user = await requireUser();
    const profile = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        designation: true,
        experience: true,
        bio: true,
        skills: true,
        education: true,
        githubUrl: true,
        linkedinUrl: true,
        portfolioUrl: true,
        department: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true } },
      },
    });
    return ok(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = parseBody(profileSchema, await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: body.name,
        designation: body.designation,
        experience: body.experience,
        bio: body.bio,
        skills: body.skills,
        education: body.education,
        githubUrl: body.githubUrl || null,
        linkedinUrl: body.linkedinUrl || null,
        portfolioUrl: body.portfolioUrl || null,
        departmentId: body.departmentId,
      },
    });
    await prisma.activityLog.create({
      data: { userId: user.id, action: "PROFILE_UPDATED", entity: "User", entityId: user.id },
    });
    return ok({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      designation: updated.designation,
      skills: updated.skills,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
