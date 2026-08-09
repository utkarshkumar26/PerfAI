import { prisma } from "@/lib/prisma";
import { verifyCredentials } from "./auth.service";

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    department: {
      upsert: jest.fn(),
    },
  },
}));

describe("verifyCredentials", () => {
  it("creates the default manager account when the seeded manager is missing", async () => {
    const createdUser = {
      id: "mgr-1",
      email: "manager@perfai.demo",
      name: "Priya Sharma",
      passwordHash: "$2a$12$ALW1x4kYhehivX4j9lW/5eHk6x0IUO1iI4fNf8vy2nFJr7MjfLQeG",
      role: "MANAGER",
    };

    (prisma.user.findUnique as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(createdUser);
    (prisma.department.upsert as jest.Mock).mockResolvedValueOnce({ id: "dept-1" });
    (prisma.user.create as jest.Mock).mockResolvedValueOnce(createdUser);

    const user = await verifyCredentials({ email: "manager@perfai.demo", password: "Password1" });

    expect(user.email).toBe("manager@perfai.demo");
    expect(prisma.department.upsert).toHaveBeenCalledWith({
      where: { name: "Engineering" },
      update: {},
      create: { name: "Engineering" },
    });
    expect(prisma.user.create).toHaveBeenCalled();
  });
});
