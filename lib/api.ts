import { z, ZodError, ZodSchema } from "zod";
import { NextResponse } from "next/server";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
  }
}

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: message, details }, { status });
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) return fail(error.message, error.status, error.details);
  if (error instanceof ZodError) {
    return fail("Validation failed", 422, error.flatten().fieldErrors);
  }

  const message = error instanceof Error ? error.message : String(error);
  const name = error instanceof Error ? error.name : "";
  const code =
    typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
      ? error.code
      : "";
  const lower = message.toLowerCase();

  if (
    name === "PrismaClientInitializationError" ||
    code === "P1000" ||
    code === "P1001" ||
    code === "P1017" ||
    lower.includes("environment variable not found: database_url") ||
    lower.includes("can't reach database server")
  ) {
    console.error("[API Error] Database connection failed", error);
    return fail(
      "Cannot connect to the database. Set DATABASE_URL in Vercel and confirm Postgres is reachable.",
      503
    );
  }

  if (code === "P2021" || code === "P2022") {
    console.error("[API Error] Database schema is missing", error);
    return fail("Database schema is not applied. Run prisma migrate deploy on production.", 503);
  }

  if (
    lower.includes("429") ||
    lower.includes("too many requests") ||
    lower.includes("rate limit") ||
    lower.includes("quota") ||
    lower.includes("temporarily unavailable")
  ) {
    return fail("AI service is temporarily unavailable. Please try again later.", 503);
  }

  if (lower.includes("api key") || lower.includes("openai") || lower.includes("gemini")) {
    return fail("AI service is not configured correctly. Please contact support.", 500);
  }

  console.error("[API Error]", error);
  return fail("Internal server error", 500);
}

export function requireDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new ApiError(
      503,
      "Database is not configured. Set DATABASE_URL in Vercel environment variables, run migrations, then redeploy."
    );
  }
}

export function parseBody<S extends ZodSchema>(schema: S, body: unknown): z.output<S> {
  return schema.parse(body);
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
