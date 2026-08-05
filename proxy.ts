import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];
const PROTECTED_PREFIXES = ["/dashboard", "/alerts", "/calendar", "/cars", "/clients", "/communication", "/contracts", "/drivers", "/finances", "/help", "/invoices", "/reports", "/reservations", "/settings", "/workspace", "/onboarding"];

function hasSessionCookie(request: NextRequest) {
  return request.cookies.has("better-auth.session_token");
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasSessionCookie(request);

  if (PUBLIC_AUTH_ROUTES.includes(pathname) && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && !hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/onboarding/:path*",
    "/dashboard/:path*",
    "/alerts/:path*",
    "/calendar/:path*",
    "/cars/:path*",
    "/clients/:path*",
    "/communication/:path*",
    "/contracts/:path*",
    "/drivers/:path*",
    "/finances/:path*",
    "/help/:path*",
    "/invoices/:path*",
    "/reports/:path*",
    "/reservations/:path*",
    "/settings/:path*",
    "/workspace/:path*",
  ],
};
