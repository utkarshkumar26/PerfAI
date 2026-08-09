/**
 * Goal service permission tests. Prisma is mocked; tests verify RBAC rules,
 * not database behavior.
 */
import type { User } from "@prisma/client";

const findUniqueMock = jest.fn();
const updateMock = jest.fn();
const deleteMock = jest.fn();
const activityCreateMock = jest.fn();
const notificationCreateMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    goal: {
      findUnique: (...args: unknown[]) => findUniqueMock(...args),
      update: (...args: unknown[]) => updateMock(...args),
      delete: (...args: unknown[]) => deleteMock(...args),
    },
    activityLog: { create: (...args: unknown[]) => activityCreateMock(...args) },
    notification: { create: (...args: unknown[]) => notificationCreateMock(...args) },
  },
}));

// server-only is a no-op in tests
jest.mock("server-only", () => ({}));

import { updateGoal, deleteGoal } from "@/features/goals/actions/goal.service";
import { ApiError } from "@/lib/api";

const EMPLOYEE: User = { id: "emp-1", role: "EMPLOYEE" } as User;
const OTHER_EMPLOYEE: User = { id: "emp-2", role: "EMPLOYEE" } as User;
const MANAGER: User = { id: "mgr-1", role: "MANAGER" } as User;

const GOAL = {
  id: "goal-1",
  userId: "emp-1",
  assignedById: "mgr-1",
  status: "IN_PROGRESS",
  title: "Ship feature",
} as never;

beforeEach(() => {
  jest.clearAllMocks();
  findUniqueMock.mockResolvedValue(GOAL);
  updateMock.mockResolvedValue({ ...GOAL, status: "COMPLETED" });
});

describe("updateGoal permissions", () => {
  it("rejects when employee edits another employee's goal", async () => {
    await expect(
      updateGoal(OTHER_EMPLOYEE, "goal-1", { title: "hacked" })
    ).rejects.toBeInstanceOf(ApiError);
    await expect(
      updateGoal(OTHER_EMPLOYEE, "goal-1", { title: "hacked" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("rejects when employee sets approved", async () => {
    await expect(
      updateGoal(EMPLOYEE, "goal-1", { approved: true })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("allows the assigner manager to approve", async () => {
    await expect(
      updateGoal(MANAGER, "goal-1", { approved: true })
    ).resolves.toBeTruthy();
  });

  it("allows owner to complete own goal and notifies", async () => {
    await updateGoal(EMPLOYEE, "goal-1", { status: "COMPLETED" });
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ progress: 100 }) })
    );
    expect(notificationCreateMock).toHaveBeenCalled();
  });
});

describe("deleteGoal permissions", () => {
  it("rejects deletion by a non-owner employee", async () => {
    await expect(deleteGoal(OTHER_EMPLOYEE, "goal-1")).rejects.toMatchObject({
      status: 403,
    });
  });

  it("allows owner to delete", async () => {
    await deleteGoal(EMPLOYEE, "goal-1");
    expect(deleteMock).toHaveBeenCalledWith({ where: { id: "goal-1" } });
  });
});
