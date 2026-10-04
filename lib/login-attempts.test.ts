const evalMock = jest.fn();
const isRedisConfiguredMock = jest.fn(() => true);

jest.mock("@/lib/redis", () => ({
  isRedisConfigured: () => isRedisConfiguredMock(),
  getRedisClient: () => ({
    createScript: (script: string) => ({
      eval: (...args: unknown[]) => evalMock(script, ...args),
    }),
  }),
}));
jest.mock("server-only", () => ({}));

import {
  clearFailedLogins,
  getLoginLockResponse,
  recordFailedLogin,
} from "@/lib/login-attempts";

beforeEach(() => {
  jest.clearAllMocks();
  isRedisConfiguredMock.mockReturnValue(true);
});

describe("login attempt lockout", () => {
  it("reports two attempts remaining after the first failed login", async () => {
    evalMock.mockResolvedValue([1, 0]);

    const response = await recordFailedLogin("Person@example.com");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.attemptsRemaining).toBe(2);
    expect(body.error).toContain("2 attempts remaining");
    expect(evalMock.mock.calls[0][1][0]).toContain(
      "perfai:login-attempts:v1:"
    );
    expect(evalMock.mock.calls[0][1][0]).not.toContain("Person@example.com");
  });

  it("reports one attempt remaining after the second failed login", async () => {
    evalMock.mockResolvedValue([2, 0]);

    const response = await recordFailedLogin("person@example.com");
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.attemptsRemaining).toBe(1);
  });

  it("locks after the third failed login for one hour", async () => {
    evalMock.mockResolvedValue([3, 3600]);

    const response = await recordFailedLogin("person@example.com");
    const body = await response.json();

    expect(response.status).toBe(423);
    expect(response.headers.get("Retry-After")).toBe("3600");
    expect(body.locked).toBe(true);
    expect(body.retryAfterSeconds).toBe(3600);
  });

  it("blocks attempts while a lock is active", async () => {
    evalMock.mockResolvedValue(1800);

    const response = await getLoginLockResponse("person@example.com");

    expect(response?.status).toBe(423);
    expect(response?.headers.get("Retry-After")).toBe("1800");
  });

  it("clears failed attempts after a successful login", async () => {
    evalMock.mockResolvedValue(2);

    await expect(clearFailedLogins("person@example.com")).resolves.toBeUndefined();
    expect(evalMock.mock.calls[0][0]).toContain("DEL");
    expect(evalMock.mock.calls[0][1]).toHaveLength(2);
  });

  it("uses a local-only counter in development when shared Redis is not configured", async () => {
    isRedisConfiguredMock.mockReturnValue(false);
    const email = `local-${Date.now()}@example.com`;

    const first = await recordFailedLogin(email);
    const firstBody = await first.json();
    const second = await recordFailedLogin(email);
    const secondBody = await second.json();
    const third = await recordFailedLogin(email);
    const thirdBody = await third.json();
    const blocked = await getLoginLockResponse(email);

    expect(firstBody.attemptsRemaining).toBe(2);
    expect(secondBody.attemptsRemaining).toBe(1);
    expect(third.status).toBe(423);
    expect(thirdBody.retryAfterSeconds).toBe(3600);
    expect(blocked?.status).toBe(423);
    expect(evalMock).not.toHaveBeenCalled();
  });

  it("clears the local failed-attempt counter after successful login", async () => {
    isRedisConfiguredMock.mockReturnValue(false);
    const email = `reset-${Date.now()}@example.com`;
    await recordFailedLogin(email);

    await clearFailedLogins(email);

    const response = await recordFailedLogin(email);
    const body = await response.json();
    expect(body.attemptsRemaining).toBe(2);
  });
});
