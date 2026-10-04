import type { User } from "@prisma/client";

const reviewCreateMock = jest.fn();
const reviewFindManyMock = jest.fn();
const userFindUniqueMock = jest.fn();
const activityCreateMock = jest.fn();
const notificationCreateMock = jest.fn();
const transactionClient = {
  review: { create: (...args: unknown[]) => reviewCreateMock(...args) },
  activityLog: { create: (...args: unknown[]) => activityCreateMock(...args) },
  notification: { create: (...args: unknown[]) => notificationCreateMock(...args) },
};
const transactionMock = jest.fn(
  (callback: (tx: typeof transactionClient) => Promise<unknown>) => callback(transactionClient)
);

jest.mock("@/lib/prisma", () => ({
  prisma: {
    $transaction: (callback: (tx: typeof transactionClient) => Promise<unknown>) =>
      transactionMock(callback),
    review: {
      create: (...args: unknown[]) => reviewCreateMock(...args),
      findMany: (...args: unknown[]) => reviewFindManyMock(...args),
    },
    user: { findUnique: (...args: unknown[]) => userFindUniqueMock(...args) },
  },
}));
jest.mock("server-only", () => ({}));

import { listReviews, saveGeneratedReview } from "@/features/reviews/actions/review.service";
import { decodeDateCursor } from "@/lib/date-cursor";

const user = { id: "employee-1" } as User;
const reviewInput = {
  period: "2026-W40",
  type: "WEEKLY" as const,
  achievements: "Completed the main delivery goals.",
  skillsUsed: [],
};
const generated = {
  review: "Strong progress this week.",
  strengths: ["Delivery"],
  weaknesses: [],
  growthAreas: [],
  rating: 4,
  actionPlan: "Continue current work.",
};

beforeEach(() => {
  jest.clearAllMocks();
  reviewCreateMock.mockResolvedValue({ id: "review-1", period: reviewInput.period, rating: 4 });
  reviewFindManyMock.mockResolvedValue([]);
  activityCreateMock.mockResolvedValue({});
  notificationCreateMock.mockResolvedValue({});
});

describe("saveGeneratedReview", () => {
  it("creates the review, activity log, and notification in one transaction", async () => {
    await saveGeneratedReview(user, reviewInput, generated);

    expect(transactionMock).toHaveBeenCalledTimes(1);
    expect(reviewCreateMock).toHaveBeenCalledTimes(1);
    expect(activityCreateMock).toHaveBeenCalledTimes(1);
    expect(notificationCreateMock).toHaveBeenCalledTimes(1);
  });

  describe("listReviews", () => {
    it("returns a stable next cursor and removes manager-only fields for employees", async () => {
      const first = {
        id: "b992cf60-f23e-4cd4-94af-e12db13bc963",
        createdAt: new Date("2026-10-04T12:00:00.000Z"),
        rating: 4,
        annualPerformance: "private",
        user: { id: user.id, name: "Employee", avatarUrl: null },
      };
      reviewFindManyMock.mockResolvedValue([
        first,
        {
          ...first,
          id: "120443ba-0c4f-4e11-a56b-40b2e8467f9b",
          createdAt: new Date("2026-10-03T12:00:00.000Z"),
        },
      ]);

      const result = await listReviews(user, {
        pageSize: 1,
        cursor: undefined,
        type: undefined,
        userId: undefined,
      });

      expect(result.hasMore).toBe(true);
      expect(result.items[0]).not.toHaveProperty("rating");
      expect(result.items[0]).not.toHaveProperty("annualPerformance");
      expect(decodeDateCursor(result.nextCursor ?? undefined)).toEqual({
        id: first.id,
        createdAt: first.createdAt,
      });
      expect(reviewFindManyMock).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ createdAt: "desc" }, { id: "desc" }],
          take: 2,
        })
      );
    });

    it("does not allow a manager to paginate another manager's employee reviews", async () => {
      userFindUniqueMock.mockResolvedValue({ managerId: "another-manager" });
      const manager = { id: "manager-1", role: "MANAGER" } as User;

      await expect(
        listReviews(manager, {
          pageSize: 20,
          cursor: undefined,
          type: undefined,
          userId: "c34f87c4-b280-459c-bf84-e8d24dffcc2f",
        })
      ).rejects.toMatchObject({ status: 403 });
      expect(reviewFindManyMock).not.toHaveBeenCalled();
    });
  });

  it("rejects the operation when a required database write fails", async () => {
    notificationCreateMock.mockRejectedValue(new Error("notification write failed"));

    await expect(saveGeneratedReview(user, reviewInput, generated)).rejects.toThrow(
      "notification write failed"
    );
  });
});
