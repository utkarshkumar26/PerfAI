import { z } from "zod";

export const careerRequestSchema = z.object({
  type: z.enum(["ROADMAP", "SKILL_GAP", "PROMOTION", "LEARNING", "SALARY", "INTERVIEW"]),
  currentRole: z.string().min(2).max(100),
  experience: z.number().int().min(0).max(50),
  skills: z.array(z.string().min(1).max(50)).min(1).max(20),
  targetRole: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export type CareerRequestInput = z.infer<typeof careerRequestSchema>;
