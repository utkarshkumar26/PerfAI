import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { loginSchema } from "@/features/auth/validations/auth.schema";
import { verifyCredentials } from "@/features/auth/actions/auth.service";
import { createSession } from "@/features/auth/actions/session";

export async function POST(request: NextRequest) {
  try {
    const body = parseBody(loginSchema, await request.json());
    const user = await verifyCredentials(body);
    await createSession(user.id);
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
  } catch (error) {
    return handleApiError(error);
  }
}
