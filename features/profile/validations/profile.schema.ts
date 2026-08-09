import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  designation: z.string().max(100).optional(),
  experience: z.number().int().min(0).max(50).optional(),
  bio: z.string().max(1000).optional(),
  skills: z.array(z.string().min(1).max(50)).max(30).optional(),
  education: z.string().max(200).optional(),
  githubUrl: z.string().url().or(z.literal("")).optional(),
  linkedinUrl: z.string().url().or(z.literal("")).optional(),
  portfolioUrl: z.string().url().or(z.literal("")).optional(),
  departmentId: z.string().uuid().nullable().optional(),
});

export type ProfileInput = z.infer<typeof profileSchema>;
