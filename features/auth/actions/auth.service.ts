import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { LoginInput, RegisterInput } from "../validations/auth.schema";

const SALT_ROUNDS = 12;
const DEMO_MANAGER_EMAIL = "manager@perfai.demo";
const DEMO_MANAGER_PASSWORD = "Password1";

export async function ensureDemoManager() {
  const existing = await prisma.user.findUnique({ where: { email: DEMO_MANAGER_EMAIL } });
  if (existing) return existing;

  const department = await prisma.department.upsert({
    where: { name: "Engineering" },
    update: {},
    create: { name: "Engineering" },
  });

  const passwordHash = await bcrypt.hash(DEMO_MANAGER_PASSWORD, SALT_ROUNDS);

  return prisma.user.create({
    data: {
      email: DEMO_MANAGER_EMAIL,
      name: "Priya Sharma",
      passwordHash,
      role: "MANAGER",
      designation: "Engineering Manager",
      experience: 9,
      skills: ["Leadership", "Strategy", "TypeScript"],
      departmentId: department.id,
    },
  });
}

export async function registerUser(input: RegisterInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, "An account with this email already exists");

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash },
  });

  await prisma.activityLog.create({
    data: { userId: user.id, action: "USER_REGISTERED", entity: "User", entityId: user.id },
  });

  return user;
}

export async function verifyCredentials(input: LoginInput) {
  const email = input.email.trim().toLowerCase();

  if (email === DEMO_MANAGER_EMAIL) {
    await ensureDemoManager();
  }

  const user = await prisma.user.findUnique({ where: { email } });
  // Constant-shape failure to avoid leaking which field was wrong.
  if (!user) throw new ApiError(401, "Invalid email or password");
  const valid = await bcrypt.compare(input.password, user.passwordHash);
  if (!valid) throw new ApiError(401, "Invalid email or password");
  return user;
}
