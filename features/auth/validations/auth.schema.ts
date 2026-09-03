import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(80),
  email: z.string().email("Enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/[0-9]/, "Password must contain a number"),
});

export const loginRoleSchema = z.enum(["EMPLOYEE", "MANAGER"]);

export const loginSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  role: loginRoleSchema.optional().default("EMPLOYEE"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.input<typeof loginSchema>;
export type LoginRole = z.infer<typeof loginRoleSchema>;

