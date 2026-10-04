import "server-only";
import type { Prisma } from "@prisma/client";
import { ApiError } from "@/lib/api";
import { decodeDateCursor, encodeDateCursor } from "@/lib/date-cursor";
import { prisma } from "@/lib/prisma";
import type { NotificationQuery } from "../validations/notification.schema";

export async function listNotifications(userId: string, query: NotificationQuery) {
  const cursor = decodeDateCursor(query.cursor);
  if (cursor && typeof cursor.read !== "boolean") {
    throw new ApiError(422, "Invalid pagination cursor");
  }

  let where: Prisma.NotificationWhereInput = { userId };
  if (cursor) {
    const withinReadGroup: Prisma.NotificationWhereInput = {
      read: cursor.read,
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
    where = {
      userId,
      OR: cursor.read ? [withinReadGroup] : [withinReadGroup, { read: true }],
    };
  }

  const results = await prisma.notification.findMany({
    where,
    orderBy: [{ read: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    take: query.pageSize + 1,
  });
  const hasMore = results.length > query.pageSize;
  const items = results.slice(0, query.pageSize);
  const lastItem = items.at(-1);

  return {
    items,
    nextCursor: hasMore && lastItem
      ? encodeDateCursor({
          id: lastItem.id,
          createdAt: lastItem.createdAt,
          read: lastItem.read,
        })
      : null,
    hasMore,
  };
}
