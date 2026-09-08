import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Middleware runs in Edge runtime.
// Auth cookie presence is checked; full session validation happen in Server Components.

const PUBLIC_PATHS = ["/login", "/api/auth", "/setup", "/api/setup", "/api/ping"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Next.js internals & static assets (including all public/ files)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/uploads") ||
    /\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|webmanifest)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Check setup completion via cookie (set by /api/setup/complete)
  const setupDone = request.cookies.get("gadget-pos-setup-complete")?.value === "1";
  const hasDbUrl = !!process.env.DATABASE_URL;
  const hasAuthSecret = !!process.env.BETTER_AUTH_SECRET;

  // If setup IS done and trying to access /setup, redirect to login/pos
  const isSetupPath = pathname.startsWith("/setup") || pathname.startsWith("/api/setup");
  if (setupDone && isSetupPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Auth routes must always be accessible (Better Auth sign-in/out/session)
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // If setup NOT done, redirect to setup (unless already there), but allow other API routes if needed?
  // No, strict barrier: if setup incomplete, force setup.
  // Exception: /api/setup/* is needed.
  if ((!setupDone || !hasDbUrl || !hasAuthSecret) && !isSetupPath) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  // Check auth via session cookie – no DB round-trip needed in Edge runtime.
  // Better Auth uses "better-auth.session_token" (or __Secure- prefixed on HTTPS).
  const hasSession =
    !!request.cookies.get("better-auth.session_token")?.value ||
    !!request.cookies.get("__Secure-better-auth.session_token")?.value;

  // If authenticated user tries to access /login, redirect to /pos
  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/pos", request.url));
  }

  // Allow public paths (auth + setup wizard) - check this AFTER the redirect-if-logged-in check
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // If not authenticated and trying to access protected route, redirect to login
  if (!hasSession) {
    const url = new URL("/login", request.url);
    // Optional: add ?callbackUrl=... if needed, but for POS simple redirect is fine
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpe?g|gif|webp|svg|ico|woff2?|ttf|otf|eot|webmanifest)).*)",
  ],
};
