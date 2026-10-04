const getMock = jest.fn();
const setMock = jest.fn();

jest.mock("@/lib/redis", () => ({
  getRedisClient: () => ({ get: (...args: unknown[]) => getMock(...args), set: (...args: unknown[]) => setMock(...args) }),
}));
jest.mock("server-only", () => ({}));

import {
  analyticsCacheKey,
  readAnalyticsCache,
  writeAnalyticsCache,
} from "@/features/analytics/actions/analytics-cache";

beforeEach(() => {
  jest.clearAllMocks();
  setMock.mockResolvedValue("OK");
});

describe("analytics cache", () => {
  it("returns cached data without running the loader", async () => {
    getMock.mockResolvedValue({ completed: 3 });

    await expect(readAnalyticsCache("analytics-test")).resolves.toEqual({ completed: 3 });
  });

  it("returns undefined on a cache miss", async () => {
    getMock.mockResolvedValue(null);

    await expect(readAnalyticsCache("analytics-test")).resolves.toBeUndefined();
  });

  it("stores results with their TTL", async () => {
    await writeAnalyticsCache("analytics-test", 30, { completed: 4 });

    expect(setMock).toHaveBeenCalledWith("analytics-test", { completed: 4 }, { ex: 30 });
  });

  it("logs cache failures while allowing callers to continue with fresh data", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => undefined);
    getMock.mockRejectedValue(new Error("Redis unavailable"));
    setMock.mockRejectedValue(new Error("Redis unavailable"));

    await expect(readAnalyticsCache("analytics-test")).resolves.toBeUndefined();
    await expect(writeAnalyticsCache("analytics-test", 30, { completed: 5 })).resolves.toBeUndefined();
    expect(log).toHaveBeenCalledTimes(2);
    log.mockRestore();
  });

  it("isolates keys by user and query scope", () => {
    expect(analyticsCacheKey(["weekly", "user-a", "self"])).not.toBe(
      analyticsCacheKey(["weekly", "user-b", "self"])
    );
  });
});
