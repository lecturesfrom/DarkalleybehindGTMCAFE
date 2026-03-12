import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = ["/login", "/api/auth"];

// Routes that bypass all auth/status checks (redirect routes, static assets)
const ALWAYS_PUBLIC_PREFIXES = ["/r/", "/_next/", "/favicon.ico", "/api/auth/"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Always allow public prefixes
  if (ALWAYS_PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  const session = req.auth;
  const isLoggedIn = !!session?.user;

  // Unauthenticated → redirect to login (except public routes)
  if (!isLoggedIn) {
    if (PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r))) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const { role, status } = session.user;

  // Suspended users → back to login with error
  if (status === "SUSPENDED") {
    if (pathname === "/login") return NextResponse.next();
    const url = new URL("/login", req.url);
    url.searchParams.set("error", "suspended");
    return NextResponse.redirect(url);
  }

  // PENDING users can only access /pending
  if (status === "PENDING") {
    if (pathname === "/pending") return NextResponse.next();
    return NextResponse.redirect(new URL("/pending", req.url));
  }

  // Logged-in ACTIVE users visiting /login → send to dashboard
  if (pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ACTIVE users visiting /pending → send to dashboard
  if (pathname === "/pending") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Admin-only routes (pages: /admin/*, API: /api/admin/*)
  const isAdminRoute =
    pathname.startsWith("/admin") || pathname.startsWith("/api/admin");
  if (isAdminRoute && role !== "ADMIN") {
    if (pathname.startsWith("/api/")) {
      return new NextResponse(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  // Run middleware on all routes except static files and Next.js internals
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
