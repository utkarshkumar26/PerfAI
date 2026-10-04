import { decodeDateCursor, encodeDateCursor } from "@/lib/date-cursor";

describe("date cursor", () => {
  it("round-trips stable ordering fields", () => {
    const cursor = {
      id: "b992cf60-f23e-4cd4-94af-e12db13bc963",
      createdAt: new Date("2026-10-04T12:30:00.000Z"),
      read: false,
    };

    expect(decodeDateCursor(encodeDateCursor(cursor))).toEqual(cursor);
  });

  it("rejects malformed cursors", () => {
    expect(() => decodeDateCursor("not-a-cursor")).toThrow("Invalid pagination cursor");
  });

  it("returns no cursor when the first page has no continuation", () => {
    expect(decodeDateCursor(undefined)).toBeUndefined();
  });
});
