import { z } from "zod";

export const notificationQuerySchema = z.object({
  cursor: z.string().max(256).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
