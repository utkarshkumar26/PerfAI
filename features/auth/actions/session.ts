import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import { ApiError } from "@/lib/api";
import type { Role, User } from "@prisma/client";

/**
 * Session-based authentication (V1).
 *
 * Sessions are stored in a signed, httpOnly cookie containing
 * `userId.expiry.signature` (HMAC-SHA256). There is no JWT and no session
 * table. To migrate to JWT later, replace `createSession`/`readSessionToken`
 * with JWT sign/verify — callers of `getSessionUser`/`requireUser` stay the
 * same.
 */

export const SESSION_COOKIE = "pr_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  userId: string;
  expiresAt: number;
}

function sign(value: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(value).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

function encode(payload: SessionPayload): string {
  const body = `${payload.userId}.${payload.expiresAt}`;
  return `${body}.${sign(body)}`;
}

function decode(token: string): SessionPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userId, expiresAtRaw, signature] = parts;
  if (!safeEqual(sign(`${userId}.${expiresAtRaw}`), signature)) return null;
  const expiresAt = Number(expiresAtRaw);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  return { userId, expiresAt };
}

export async function createSession(userId: string): Promise<void> {
  const token = encode({ userId, expiresAt: Date.now() + SESSION_TTL_MS });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  return decode(token);
}

export const getSessionUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const payload = readSessionToken(store.get(SESSION_COOKIE)?.value);
  if (!payload) return null;
  return prisma.user.findUnique({ where: { id: payload.userId } });
});

/** Require an authenticated user; throws ApiError(401). */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) throw new ApiError(401, "Authentication required");
  return user;
}

/** Require an authenticated user with one of the given roles; throws 401/403. */
export async function requireRole(...roles: Role[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) throw new ApiError(403, "Insufficient permissions");
  return user;
}
