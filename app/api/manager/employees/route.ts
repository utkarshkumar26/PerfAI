import { NextRequest } from "next/server";
import { ok, handleApiError, getPagination } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import { listEmployees } from "@/features/manager/actions/manager.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const p = getPagination(request.nextUrl.searchParams);
    return ok(
      await listEmployees(user, {
        search: request.nextUrl.searchParams.get("search") ?? undefined,
        departmentId: request.nextUrl.searchParams.get("departmentId") ?? undefined,
        ...p,
      })
    );
  } catch (error) {
    return handleApiError(error);
  }
}
