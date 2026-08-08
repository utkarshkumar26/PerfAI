export const env = {
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  AUTH_SECRET: process.env.AUTH_SECRET ?? "dev-secret-change-me",
  AI_PROVIDER: (process.env.AI_PROVIDER ?? "openai") as "openai" | "gemini",
  AI_MODEL: process.env.AI_MODEL ?? "gpt-4o-mini",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ?? "",
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
} as const;
