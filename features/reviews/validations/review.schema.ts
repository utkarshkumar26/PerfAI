import { z } from "zod";

export const reviewInputSchema = z.object({
  period: z.string().min(1, "Period is required").max(20), // e.g. "2026-W32"
  type: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "MANUAL"]).default("MANUAL"),
  achievements: z.string().min(10, "Describe at least one achievement").max(2000),
  challenges: z.string().max(2000).optional(),
  projects: z.string().max(2000).optional(),
  clientFeedback: z.string().max(2000).optional(),
  skillsUsed: z.array(z.string().min(1).max(50)).max(20).default([]),
  learning: z.string().max(2000).optional(),
  leadership: z.string().max(2000).optional(),
  collaboration: z.string().max(2000).optional(),
});

export const reviewQuerySchema = z.object({
  type: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "ANNUAL", "MANUAL"]).optional(),
  userId: z.string().uuid().optional(),
});

export const updateReviewSchema = z.object({
  content: z.string().min(10).max(20000).optional(),
  rating: z.number().min(1).max(5).optional(),
  actionPlan: z.string().max(5000).optional(),
});

export type ReviewInput = z.infer<typeof reviewInputSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
