import "server-only";
import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { getRedisClient, isRedisConfigured } from "@/lib/redis";

const MAX_FAILED_ATTEMPTS = 3;
const LOCK_SECONDS = 60 * 60;
const KEY_PREFIX = "perfai:login-attempts:v1";
const localAttempts = new Map<
  string,
  { count: number; expiresAt: number; lockedUntil: number }
>();

const checkLockScript = `
local ttl = redis.call("TTL", KEYS[1])
if ttl > 0 then
  return ttl
end
return 0
`;

const recordFailureScript = `
local attempts = redis.call("INCR", KEYS[1])
if attempts == 1 then
  redis.call("EXPIRE", KEYS[1], ARGV[1])
end
if attempts >= tonumber(ARGV[2]) then
  redis.call("SET", KEYS[2], "1", "EX", ARGV[3])
  return { attempts, redis.call("TTL", KEYS[2]) }
end
return { attempts, 0 }
`;

const clearAttemptsScript = `
return redis.call("DEL", KEYS[1], KEYS[2])
`;

function keysForEmail(email: string): [string, string] {
  const digest = createHash("sha256").update(email.trim().toLowerCase()).digest("hex");
  return [`${KEY_PREFIX}:${digest}:count`, `${KEY_PREFIX}:${digest}:lock`];
}

function serviceUnavailable(error: unknown): never {
  console.error("[Login attempts] Shared Redis operation failed", error);
  throw new ApiError(503, "Login protection is temporarily unavailable. Please try again later.");
}

function localRecordFor(email: string) {
  const key = keysForEmail(email)[0];
  const now = Date.now();
  const current = localAttempts.get(key);
  if (current?.lockedUntil && current.lockedUntil > now) return current;
  if (!current || current.expiresAt <= now) {
    const next = { count: 0, expiresAt: now + LOCK_SECONDS * 1000, lockedUntil: 0 };
    localAttempts.set(key, next);
    return next;
  }
  return current;
}

function localLockResponse(email: string): NextResponse | null {
  const state = localRecordFor(email);
  const remainingSeconds = Math.ceil((state.lockedUntil - Date.now()) / 1000);
  if (remainingSeconds <= 0) {
    if (state.lockedUntil > 0) {
      state.count = 0;
      state.lockedUntil = 0;
    }
    return null;
  }

  return NextResponse.json(
    {
      success: false,
      error: "This account is temporarily locked after 3 incorrect sign-in attempts.",
      locked: true,
      retryAfterSeconds: remainingSeconds,
    },
    { status: 423, headers: { "Retry-After": String(remainingSeconds) } }
  );
}

function localFailedLoginResponse(email: string): NextResponse {
  const state = localRecordFor(email);
  state.count += 1;
  if (state.count >= MAX_FAILED_ATTEMPTS) {
    state.lockedUntil = Date.now() + LOCK_SECONDS * 1000;
    const retryAfterSeconds = LOCK_SECONDS;
    return NextResponse.json(
      {
        success: false,
        error: "This account is locked for 1 hour after 3 incorrect sign-in attempts.",
        locked: true,
        retryAfterSeconds,
      },
      { status: 423, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const attemptsRemaining = MAX_FAILED_ATTEMPTS - state.count;
  return NextResponse.json(
    {
      success: false,
      error: `Invalid email or password. ${attemptsRemaining} ${
        attemptsRemaining === 1 ? "attempt" : "attempts"
      } remaining before a 1-hour lock.`,
      attemptsRemaining,
    },
    { status: 401 }
  );
}

export async function getLoginLockResponse(email: string): Promise<NextResponse | null> {
  if (!isRedisConfigured()) {
    if (process.env.NODE_ENV !== "production") return localLockResponse(email);
    try {
      getRedisClient();
    } catch (error) {
      return serviceUnavailable(error);
    }
  }

  const [, lockKey] = keysForEmail(email);
  try {
    const remainingSeconds = Number(
      await getRedisClient().createScript<number>(checkLockScript).eval([lockKey], [])
    );
    if (remainingSeconds <= 0) return null;

    return NextResponse.json(
      {
        success: false,
        error: "This account is temporarily locked after 3 incorrect sign-in attempts.",
        locked: true,
        retryAfterSeconds: remainingSeconds,
      },
      {
        status: 423,
        headers: { "Retry-After": String(remainingSeconds) },
      }
    );
  } catch (error) {
    return serviceUnavailable(error);
  }
}

export async function recordFailedLogin(email: string): Promise<NextResponse> {
  if (!isRedisConfigured()) {
    if (process.env.NODE_ENV !== "production") return localFailedLoginResponse(email);
    try {
      getRedisClient();
    } catch (error) {
      return serviceUnavailable(error);
    }
  }

  const [attemptsKey, lockKey] = keysForEmail(email);
  try {
    const result = await getRedisClient()
      .createScript<[number, number]>(recordFailureScript)
      .eval(
        [attemptsKey, lockKey],
        [String(LOCK_SECONDS), String(MAX_FAILED_ATTEMPTS), String(LOCK_SECONDS)]
      );
    const attempts = Number(result[0]);
    const lockSeconds = Number(result[1]);

    if (attempts >= MAX_FAILED_ATTEMPTS) {
      return NextResponse.json(
        {
          success: false,
          error: "This account is locked for 1 hour after 3 incorrect sign-in attempts.",
          locked: true,
          retryAfterSeconds: lockSeconds,
        },
        {
          status: 423,
          headers: { "Retry-After": String(lockSeconds) },
        }
      );
    }

    const attemptsRemaining = MAX_FAILED_ATTEMPTS - attempts;
    return NextResponse.json(
      {
        success: false,
        error: `Invalid email or password. ${attemptsRemaining} ${
          attemptsRemaining === 1 ? "attempt" : "attempts"
        } remaining before a 1-hour lock.`,
        attemptsRemaining,
      },
      { status: 401 }
    );
  } catch (error) {
    return serviceUnavailable(error);
  }
}

export async function clearFailedLogins(email: string): Promise<void> {
  if (!isRedisConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      localAttempts.delete(keysForEmail(email)[0]);
      return;
    }
    try {
      getRedisClient();
    } catch (error) {
      return serviceUnavailable(error);
    }
  }

  const [attemptsKey, lockKey] = keysForEmail(email);
  try {
    await getRedisClient()
      .createScript<number>(clearAttemptsScript)
      .eval([attemptsKey, lockKey], []);
  } catch (error) {
    return serviceUnavailable(error);
  }
}
