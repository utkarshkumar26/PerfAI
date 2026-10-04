import "server-only";
import { Redis } from "@upstash/redis";
import { ApiError } from "@/lib/api";

let redis: Redis | undefined;

export function isRedisConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export function getRedisClient(): Redis {
  if (redis) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!isRedisConfigured() || !url || !token) {
    throw new ApiError(
      503,
      "Shared Redis is not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN."
    );
  }

  redis = new Redis({ url, token });
  return redis;
}
