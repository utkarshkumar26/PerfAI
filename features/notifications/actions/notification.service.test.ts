const findManyMock = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: { notification: { findMany: (...args: unknown[]) => findManyMock(...args) } },
}));
jest.mock("server-only", () => ({}));

import { decodeDateCursor, encodeDateCursor } from "@/lib/date-cursor";
import { listNotifications } from "@/features/notifications/actions/notification.service";

const notification = (id: string, read: boolean, createdAt: string) => ({
  id,
  read,
  createdAt: new Date(createdAt),
  userId: "user-1",
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("listNotifications", () => {
  it("returns a cursor when another page exists, preserving unread-first order", async () => {
    findManyMock.mockResolvedValue([
      notification("b992cf60-f23e-4cd4-94af-e12db13bc963", false, "2026-10-04T12:00:00.000Z"),
      notification("120443ba-0c4f-4e11-a56b-40b2e8467f9b", false, "2026-10-03T12:00:00.000Z"),
    ]);

    const result = await listNotifications("user-1", { pageSize: 1 });

    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(decodeDateCursor(result.nextCursor ?? undefined)).toEqual({
      id: "b992cf60-f23e-4cd4-94af-e12db13bc963",
      createdAt: new Date("2026-10-04T12:00:00.000Z"),
      read: false,
    });
    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        orderBy: [{ read: "asc" }, { createdAt: "desc" }, { id: "desc" }],
        take: 2,
      })
    );
  });

  it("continues across from unread to read notifications without skipping the read group", async () => {
    const cursor = encodeDateCursor({
      id: "b992cf60-f23e-4cd4-94af-e12db13bc963",
      createdAt: new Date("2026-10-04T12:00:00.000Z"),
      read: false,
    });
    findManyMock.mockResolvedValue([notification("120443ba-0c4f-4e11-a56b-40b2e8467f9b", true, "2026-10-02T12:00:00.000Z")]);

    await listNotifications("user-1", { pageSize: 1, cursor });

    expect(findManyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: "user-1",
          OR: expect.arrayContaining([
            expect.objectContaining({ read: true }),
          ]),
        }),
      })
    );
  });
});
