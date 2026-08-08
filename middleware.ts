import { NextRequest, NextResponse } from "next/server";

// Duplicated from features/auth/actions/session.ts — middleware runs in the
// Edge runtime and must not import Prisma/Node crypto modules.
const SESSION_COOKIE = "pr_session";

/**
 * Middleware protection.
 * - Edge-safe check only: verifies that a session cookie exists and is not
 *   expired (full signature verification happens server-side in
 *   `getSessionUser`, which uses the Node crypto module).
 * - Public: /login, /register, /, /api/auth/*
 * - /manager/* pages additionally require MANAGER/ADMIN — enforced in the
 *   (dashboard) layout via `requireRole`, since role lookup needs the DB.
 */

const PUBLIC_PATHS = ["/", "/login", "/register"];
const PUBLIC_API_PREFIXES = ["/api/auth/"];

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const [, expiresAtRaw] = token.split(".");
  const expiresAt = Number(expiresAtRaw);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = isAuthenticated(request);

  const isPublicPage = PUBLIC_PATHS.includes(pathname);
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));

  if (pathname.startsWith("/api/")) {
    if (!isPublicApi && !authed) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  if (!authed && !isPublicPage) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  if (authed && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)).*)"],
};
