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
  console.error("[API Error]", error);
  return fail("Internal server error", 500);
}

export function parseBody<S extends ZodSchema>(schema: S, body: unknown): z.output<S> {
  return schema.parse(body);
}

export function getPagination(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize")) || 10));
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}
