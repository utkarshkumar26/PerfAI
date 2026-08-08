import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { registerSchema } from "@/features/auth/validations/auth.schema";
import { registerUser } from "@/features/auth/actions/auth.service";
import { createSession } from "@/features/auth/actions/session";

export async function POST(request: NextRequest) {
  try {
    const body = parseBody(registerSchema, await request.json());
    const user = await registerUser(body);
    await createSession(user.id);
    return ok(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      201
    );
  } catch (error) {
    return handleApiError(error);
  }
}
