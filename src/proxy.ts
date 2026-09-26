import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "session";

async function hasValidSession(req: NextRequest) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return false;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi =
    pathname.startsWith("/api/galleries") ||
    pathname.startsWith("/api/media") ||
    pathname.startsWith("/api/comments") ||
    pathname.startsWith("/api/gallery-comments") ||
    pathname.startsWith("/api/settings");

  if (isAdminPage || isAdminApi) {
    const authed = await hasValidSession(req);
    if (!authed) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/galleries/:path*",
    "/api/media/:path*",
    "/api/comments/:path*",
    "/api/gallery-comments/:path*",
    "/api/settings/:path*",
  ],
};
