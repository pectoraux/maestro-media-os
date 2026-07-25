import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "maestro-dev-secret-change-in-production-2024"
);

const PUBLIC_ROUTES = ["/", "/login", "/signup"];
const API_ROUTES = ["/api"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow API routes
  if (API_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
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
      // Invalid token
    }
  }

  // Protected routes (/app, /waitlist, /admin)
  if (!user) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin-only routes
  if (pathname.startsWith("/admin") && user.role !== "super_admin" && user.role !== "platform_admin") {
    return NextResponse.redirect(new URL("/app", request.url));
  }

  // Waitlisted users can only access /waitlist, not /app
  if (pathname.startsWith("/app") && user.status === "waitlisted") {
    return NextResponse.redirect(new URL("/waitlist", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/waitlist/:path*", "/admin/:path*"],
};
