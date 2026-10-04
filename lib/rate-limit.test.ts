const limitMock = jest.fn();
const isRedisConfiguredMock = jest.fn(() => true);

jest.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow: (...args: unknown[]) => object = jest.fn(() => ({}));

    limit(...args: unknown[]) {
      return limitMock(...args);
    }
  },
}));
jest.mock("@/lib/redis", () => ({
  getRedisClient: () => ({}),
  isRedisConfigured: () => isRedisConfiguredMock(),
}));
jest.mock("server-only", () => ({}));

import { enforceRateLimit } from "@/lib/rate-limit";

beforeEach(() => {
  jest.clearAllMocks();
  isRedisConfiguredMock.mockReturnValue(true);
});

describe("enforceRateLimit", () => {
  it("returns no response when the request is within its limit", async () => {
    limitMock.mockResolvedValue({ success: true, remaining: 4, reset: Date.now() + 10000 });

    await expect(enforceRateLimit("ai-user", "user-1")).resolves.toBeNull();
  });

  it("returns 429 with a retry-after header when the limit is exceeded", async () => {
    limitMock.mockResolvedValue({ success: false, remaining: 0, reset: Date.now() + 5000 });

    const response = await enforceRateLimit("ai-user", "person@example.com");

    expect(response?.status).toBe(429);
    expect(Number(response?.headers.get("Retry-After"))).toBeGreaterThan(0);
    expect(limitMock.mock.calls[0][0]).not.toContain("person@example.com");
  });

  it("fails closed with a service error when Redis cannot check a limit", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    limitMock.mockRejectedValue(new Error("Redis unavailable"));

    await expect(enforceRateLimit("login-ip", "127.0.0.1")).rejects.toMatchObject({
      status: 503,
    });
    expect(log).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  it("uses a local development limiter when shared Redis is not configured", async () => {
    isRedisConfiguredMock.mockReturnValue(false);

    await expect(enforceRateLimit("login-ip", "local-test-ip")).resolves.toBeNull();
  });
});
