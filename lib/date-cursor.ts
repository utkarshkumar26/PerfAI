import { ApiError } from "@/lib/api";

export interface DateCursor {
  id: string;
  createdAt: Date;
  read?: boolean;
}

export function encodeDateCursor(cursor: DateCursor): string {
  return Buffer.from(
    JSON.stringify({
      id: cursor.id,
      createdAt: cursor.createdAt.toISOString(),
      ...(cursor.read === undefined ? {} : { read: cursor.read }),
    })
  ).toString("base64url");
}

export function decodeDateCursor(value?: string): DateCursor | undefined {
  if (!value) return undefined;

  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (typeof parsed !== "object" || parsed === null || !("id" in parsed) || !("createdAt" in parsed)) {
      throw new Error("Invalid cursor fields");
    }
    const { id, createdAt } = parsed;
    const read = "read" in parsed ? parsed.read : undefined;
    if (
      typeof id !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id) ||
      typeof createdAt !== "string" ||
      (read !== undefined && typeof read !== "boolean")
    ) {
      throw new Error("Invalid cursor values");
    }
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) throw new Error("Invalid cursor date");
    return { id, createdAt: date, ...(read === undefined ? {} : { read }) };
  } catch {
    throw new ApiError(422, "Invalid pagination cursor");
  }
}
