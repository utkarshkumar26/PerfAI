import { z } from "zod";

const goalStatus = z.enum(["TODO", "IN_PROGRESS", "BLOCKED", "COMPLETED"]);
const priority = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export const createGoalSchema = z.object({
  taskNumber: z.string().optional(),
  title: z.string().min(2, "Title must be at least 2 characters").max(300),
  description: z.string().max(10000).optional().nullable(),
  priority: priority.optional().default("MEDIUM"),
  status: goalStatus.optional().default("TODO"),
  category: z.string().max(100).optional().nullable(),
  dueDate: z.coerce.date().optional().nullable(),
  startDate: z.coerce.date().optional().nullable(),
  progress: z.number().int().min(0).max(100).optional().default(0),
  notes: z.string().max(5000).optional().nullable(),
  userId: z.string().uuid().optional(), // managers assign to employees

  section: z.string().max(100).optional().default("ASSIGNED"),
  project: z.string().max(100).optional().default("Wipro Build People"),
  size: z.string().max(20).optional().default("M"),
  sprint: z.string().max(100).optional().default("Sprint 42"),
  owningTeam: z.string().max(100).optional().default("Wipro Build People"),
  bugType: z.string().max(200).optional().nullable(),
  sectionOrTab: z.string().max(200).optional().nullable(),
  descriptionIfOther: z.string().max(2000).optional().nullable(),
  reproSteps: z.string().max(10000).optional().nullable(),
  expectedResult: z.string().max(5000).optional().nullable(),
  actualResult: z.string().max(5000).optional().nullable(),
  debugInfo: z.any().optional().nullable(),
  comments: z.any().optional().nullable(),
  starred: z.boolean().optional().default(false),
});

export const updateGoalSchema = createGoalSchema.partial().extend({
  approved: z.boolean().optional(), // manager-only field, enforced in service
  comment: z
    .object({
      text: z.string().min(1),
    })
    .optional(),
});

export const goalQuerySchema = z.object({
  status: goalStatus.optional(),
  priority: priority.optional(),
  category: z.string().optional(),
  search: z.string().optional(),
  userId: z.string().uuid().optional(),
  section: z.string().optional(),
  project: z.string().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  sortBy: z
    .enum(["createdAt", "dueDate", "startDate", "priority", "progress", "title", "updatedAt"])
    .default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const aiGoalSuggestionSchema = z.object({
  role: z.string().min(2).max(100),
  experience: z.number().int().min(0).max(50),
  skills: z.array(z.string().min(1).max(50)).min(1).max(20),
  careerGoal: z.string().min(5).max(500),
});

export type CreateGoalInput = z.input<typeof createGoalSchema>;
export type UpdateGoalInput = z.input<typeof updateGoalSchema>;
export type GoalQuery = z.infer<typeof goalQuerySchema>;
export type AIGoalSuggestionInput = z.infer<typeof aiGoalSuggestionSchema>;


