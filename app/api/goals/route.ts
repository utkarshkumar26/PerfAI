import { NextRequest } from "next/server";
import { ok, fail, handleApiError, parseBody, getPagination } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import {
  createGoalSchema,
  goalQuerySchema,
} from "@/features/goals/validations/goal.schema";
import { createGoal, listGoals } from "@/features/goals/actions/goal.service";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const { searchParams } = request.nextUrl;
    const parsed = goalQuerySchema.safeParse({
      status: searchParams.get("status") ?? undefined,
      priority: searchParams.get("priority") ?? undefined,
      category: searchParams.get("category") ?? undefined,
      search: searchParams.get("search") ?? undefined,
      userId: searchParams.get("userId") ?? undefined,
      dueBefore: searchParams.get("dueBefore") ?? undefined,
      dueAfter: searchParams.get("dueAfter") ?? undefined,
      sortBy: searchParams.get("sortBy") ?? undefined,
      sortOrder: searchParams.get("sortOrder") ?? undefined,
    });
    if (!parsed.success) {
      return fail("Invalid query parameters", 422, parsed.error.flatten().fieldErrors);
    }
    const data = await listGoals(user, parsed.data, getPagination(searchParams));
    return ok(data);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const body = parseBody(createGoalSchema, await request.json());
    const goal = await createGoal(user, body);
    return ok(goal, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
