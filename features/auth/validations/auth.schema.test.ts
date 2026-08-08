import { loginSchema, registerSchema } from "@/features/auth/validations/auth.schema";

describe("auth validation schemas", () => {
  it("accepts a valid registration", () => {
    const result = registerSchema.safeParse({
      name: "Ada Lovelace",
      email: "ada@example.com",
      password: "passw0rd1",
    });
    expect(result.success).toBe(true);
  });

  it("rejects weak passwords", () => {
    const result = registerSchema.safeParse({
      name: "Ada",
      email: "ada@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid emails", () => {
    expect(loginSchema.safeParse({ email: "nope", password: "x" }).success).toBe(false);
  });
});
