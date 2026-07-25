import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "maestro-dev-secret-change-in-production-2024"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes and public routes
  if (pathname.startsWith("/api") || pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return NextResponse.next();
  }

  // Only protect /app, /waitlist, /admin (and their subpaths)
  const isProtected = pathname === "/app" || pathname.startsWith("/app/") ||
                      pathname === "/waitlist" || pathname.startsWith("/waitlist/") ||
                      pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isProtected) {
    return NextResponse.next();
  }

  // Check session
  const token = request.cookies.get("maestro-session")?.value;
  let user: any = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      user = payload;
    } catch {
      // Invalid token — treat as unauthenticated
    }
  }

  // Not authenticated → redirect to login
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if ((pathname === "/admin" || pathname.startsWith("/admin/")) &&
      user.role !== "super_admin" && user.role !== "platform_admin" && user.role !== "demo_user") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Waitlisted users can only access /waitlist, not /app
  if ((pathname === "/app" || pathname.startsWith("/app/")) && user.status === "waitlisted") {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*", "/waitlist", "/waitlist/:path*", "/admin", "/admin/:path*"],
};
