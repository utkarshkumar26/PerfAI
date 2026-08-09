import { z } from "zod";

export const objectiveSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(2000).optional(),
  level: z.enum(["COMPANY", "TEAM", "INDIVIDUAL"]).default("INDIVIDUAL"),
  cycle: z.string().min(1).max(20), // e.g. "2026-Q3"
  parentId: z.string().uuid().optional(),
});

export const keyResultSchema = z.object({
  title: z.string().min(3).max(200),
  target: z.number().positive(),
  unit: z.string().max(30).optional(),
  current: z.number().min(0).default(0),
});

export const krProgressSchema = z.object({
  current: z.number().min(0),
});

export type ObjectiveInput = z.infer<typeof objectiveSchema>;
export type KeyResultInput = z.infer<typeof keyResultSchema>;
export type KrProgressInput = z.infer<typeof krProgressSchema>;
