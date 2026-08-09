import { careerRequestSchema } from "@/features/career/validations/career.schema";
import { chatMessageSchema } from "@/features/ai/validations/chat.schema";
import { objectiveSchema, keyResultSchema } from "@/features/okrs/validations/okr.schema";

describe("careerRequestSchema", () => {
  const valid = {
    type: "ROADMAP",
    currentRole: "Engineer",
    experience: 3,
    skills: ["React"],
  };

  it("accepts valid input", () => {
    expect(careerRequestSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unknown type", () => {
    expect(careerRequestSchema.safeParse({ ...valid, type: "NOPE" }).success).toBe(false);
  });

  it("requires at least one skill", () => {
    expect(careerRequestSchema.safeParse({ ...valid, skills: [] }).success).toBe(false);
  });
});

describe("chatMessageSchema", () => {
  it("requires a message", () => {
    expect(chatMessageSchema.safeParse({ message: "" }).success).toBe(false);
  });

  it("accepts a message without conversation", () => {
    expect(chatMessageSchema.safeParse({ message: "hello" }).success).toBe(true);
  });
});

describe("okr schemas", () => {
  it("accepts a valid objective", () => {
    expect(
      objectiveSchema.safeParse({ title: "Improve reliability", cycle: "2026-Q3" }).success
    ).toBe(true);
  });

  it("rejects key result with non-positive target", () => {
    expect(keyResultSchema.safeParse({ title: "KR one", target: 0 }).success).toBe(false);
  });

  it("defaults key result current to 0", () => {
    const parsed = keyResultSchema.parse({ title: "KR one", target: 10 });
    expect(parsed.current).toBe(0);
  });
});
