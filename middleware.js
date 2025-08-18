import { NextResponse } from "next/server";

const PROTECTED_PATHS = ["/admin/upload", "/api/admin/upload"];

export function middleware(req) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const cookie = req.cookies.get("admin_session");
  if (cookie?.value === "1") return NextResponse.next();

  // Not logged in → send to /admin (login)
  const url = req.nextUrl.clone();
  url.pathname = "/admin";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
