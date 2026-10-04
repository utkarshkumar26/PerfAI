import "server-only";
import { createHash } from "node:crypto";
import { Ratelimit } from "@upstash/ratelimit";
import { NextRequest, NextResponse } from "next/server";
import { ApiError } from "@/lib/api";
import { getRedisClient, isRedisConfigured } from "@/lib/redis";

type RateLimitPolicy = "login-ip" | "ai-user";

const policies: Record<RateLimitPolicy, { limit: number; window: `${number} m` }> = {
  "login-ip": { limit: 30, window: "15 m" },
  "ai-user": { limit: 20, window: "10 m" },
};

const limiters = new Map<RateLimitPolicy, Ratelimit>();
const localRequests = new Map<string, number[]>();

function enforceLocalRateLimit(
  policy: RateLimitPolicy,
  identifier: string
): NextResponse | null {
  const now = Date.now();
  const configuration = policies[policy];
  const windowMs = Number.parseInt(configuration.window, 10) * 60_000;
  const key = `${policy}:${hashIdentifier(identifier)}`;
  const recentRequests = (localRequests.get(key) ?? []).filter(
    (timestamp) => timestamp > now - windowMs
  );

  if (recentRequests.length >= configuration.limit) {
    localRequests.set(key, recentRequests);
    const reset = recentRequests[0] + windowMs;
    const retryAfter = Math.max(1, Math.ceil((reset - now) / 1000));
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(reset / 1000)),
        },
      }
    );
  }

  recentRequests.push(now);
  localRequests.set(key, recentRequests);
  return null;
}

function getLimiter(policy: RateLimitPolicy): Ratelimit {
  const cached = limiters.get(policy);
  if (cached) return cached;

  const configuration = policies[policy];
  const limiter = new Ratelimit({
    redis: getRedisClient(),
    limiter: Ratelimit.slidingWindow(configuration.limit, configuration.window),
    prefix: `perfai:rate-limit:${policy}:v1`,
    analytics: false,
  });
  limiters.set(policy, limiter);
  return limiter;
}

function hashIdentifier(identifier: string): string {
  return createHash("sha256").update(identifier).digest("hex");
}

export function getClientAddress(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const address = forwardedFor?.split(",")[0]?.trim() || request.headers.get("x-real-ip")?.trim();
  return address || "unknown";
}

export async function enforceRateLimit(
  policy: RateLimitPolicy,
  identifier: string
): Promise<NextResponse | null> {
  if (!isRedisConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      return enforceLocalRateLimit(policy, identifier);
    }
    try {
      getRedisClient();
    } catch (error) {
      console.error("[Rate limit] Shared Redis check failed", error);
      throw new ApiError(503, "Request protection is temporarily unavailable. Please try again later.");
    }
  }

  try {
    const result = await getLimiter(policy).limit(hashIdentifier(identifier));
    if (result.success) return null;

    const retryAfter = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return NextResponse.json(
      {
        success: false,
        error: "Too many requests. Please wait before trying again.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfter),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
        },
      }
    );
  } catch (error) {
    console.error("[Rate limit] Shared Redis check failed", error);
    throw new ApiError(503, "Request protection is temporarily unavailable. Please try again later.");
  }
}
