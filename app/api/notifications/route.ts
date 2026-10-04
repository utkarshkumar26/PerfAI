import { NextRequest } from "next/server";
import { ok, fail, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { notificationQuerySchema } from "@/features/notifications/validations/notification.schema";
import { listNotifications } from "@/features/notifications/actions/notification.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = notificationQuerySchema.safeParse({
      cursor: request.nextUrl.searchParams.get("cursor") ?? undefined,
      pageSize: request.nextUrl.searchParams.get("pageSize") ?? undefined,
    });
    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten().fieldErrors);
    }
    return ok(await listNotifications(user.id, parsed.data));
  } catch (error) {
    return handleApiError(error);
  }
}
