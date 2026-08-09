import { z } from "zod";

export const chatMessageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  message: z.string().min(1, "Message is required").max(4000),
});

export type ChatMessageInput = z.infer<typeof chatMessageSchema>;
