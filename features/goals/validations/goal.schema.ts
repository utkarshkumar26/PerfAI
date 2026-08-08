import { z } from "zod";

const goalStatus = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const createGoalSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(200),
  description: z.string().max(2000).optional(),
  priority: priority.default("MEDIUM"),
  status: goalStatus.default("TODO"),
  category: z.string().max(80).optional(),
  dueDate: z.coerce.date().optional(),
  progress: z.number().int().min(0).max(100).default(0),
  notes: z.string().max(2000).optional(),
  userId: z.string().uuid().optional(), // managers assign to employees
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  approved: z.boolean().optional(), // manager-only field, enforced in service
});

export const goalQuerySchema = z.object({
  status: goalStatus.optional(),
  priority: priority.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  sortBy: z.enum(["createdAt", "dueDate", "priority", "progress", "title"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const aiGoalSuggestionSchema = z.object({
  role: z.string().min(2).max(100),
  experience: z.number().int().min(0).max(50),
  skills: z.array(z.string().min(1).max(50)).min(1).max(20),
  careerGoal: z.string().min(5).max(500),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
export type GoalQuery = z.infer<typeof goalQuerySchema>;
export type AIGoalSuggestionInput = z.infer<typeof aiGoalSuggestionSchema>;
