import "server-only";
import { createHash } from "node:crypto";
import { getRedisClient } from "@/lib/redis";

export function analyticsCacheKey(parts: string[]): string {
  const digest = createHash("sha256").update(JSON.stringify(parts)).digest("hex");
  return `perfai:analytics:v1:${digest}`;
}

export async function readAnalyticsCache<T>(key: string): Promise<T | undefined> {
  try {
    const cached = await getRedisClient().get<T>(key);
    return cached === null ? undefined : cached;
  } catch (error) {
    console.error("[Analytics cache] Read failed; loading fresh data from the database", error);
    return undefined;
  }
}

export async function writeAnalyticsCache<T>(
  key: string,
  ttlSeconds: number,
  value: T
): Promise<void> {
  try {
    await getRedisClient().set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error("[Analytics cache] Write failed; returning fresh data", error);
  }
}
