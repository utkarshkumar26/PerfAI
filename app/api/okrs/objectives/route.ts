import { NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, handleApiError } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import {
  createObjective,
  listObjectives,
} from "@/features/okrs/actions/okr.service";
import { objectiveSchema, keyResultSchema } from "@/features/okrs/validations/okr.schema";

const createSchema = objectiveSchema.extend({
  keyResults: z.array(keyResultSchema).max(10).default([]),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    return ok(await listObjectives(user, request.nextUrl.searchParams.get("cycle") ?? undefined));
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return fail("Validation failed", 422, parsed.error.flatten().fieldErrors);
    }
    const { keyResults, ...objective } = parsed.data;
    return ok(await createObjective(user, objective, keyResults), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
