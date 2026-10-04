import { NextRequest } from "next/server";
import { ok, handleApiError, parseBody } from "@/lib/api";
import { loginSchema } from "@/features/auth/validations/auth.schema";
import { verifyCredentials } from "@/features/auth/actions/auth.service";
import { applySessionCookie } from "@/features/auth/actions/session";
import { enforceRateLimit, getClientAddress } from "@/lib/rate-limit";
import {
  clearFailedLogins,
  getLoginLockResponse,
  recordFailedLogin,
} from "@/lib/login-attempts";

export async function POST(request: NextRequest) {
  try {
    const ipLimit = await enforceRateLimit("login-ip", getClientAddress(request));
    if (ipLimit) return ipLimit;

    const body = parseBody(loginSchema, await request.json());
    const email = body.email.trim().toLowerCase();
    const lockResponse = await getLoginLockResponse(email);
    if (lockResponse) return lockResponse;

    let user: Awaited<ReturnType<typeof verifyCredentials>>;
    try {
      user = await verifyCredentials(body);
    } catch (error) {
      if (error instanceof Error && "status" in error && error.status === 401) {
        return await recordFailedLogin(email);
      }
      throw error;
    }
    await clearFailedLogins(email);
    return applySessionCookie(
      ok({ id: user.id, email: user.email, name: user.name, role: user.role }),
      user.id
    );
  } catch (error) {
    return handleApiError(error);
  }
}
