import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { requireUser } from "@/features/auth/actions/session";
import {
  addKeyResult,
} from "@/features/okrs/actions/okr.service";
import { keyResultSchema, krProgressSchema } from "@/features/okrs/validations/okr.schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = parseBody(keyResultSchema, await request.json());
    return ok(await addKeyResult(user, id, body), 201);
  } catch (error) {
    return handleApiError(error);
  }
}
