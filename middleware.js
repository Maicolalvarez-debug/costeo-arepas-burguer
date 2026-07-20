import { NextResponse } from "next/server";
import { isRequestAuthed } from "./lib/auth";

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const isPublic =
    pathname === "/login" ||
    pathname === "/api/login" ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon") ||
    pathname === "/manifest.json" ||
    pathname === "/favicon.ico";

  if (isPublic) return NextResponse.next();

  const cookieHeader = req.headers.get("cookie");
  const authed = await isRequestAuthed(cookieHeader);
  if (!authed) {
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
