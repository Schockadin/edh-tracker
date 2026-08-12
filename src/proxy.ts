import { NextResponse, type NextRequest } from "next/server";

import { SESSION_COOKIE, verifyToken } from "@/lib/token";

/**
 * Auth gate for the whole app (Next.js 16 `proxy` convention, formerly
 * `middleware`). Everything except the login page and a small allow-list of
 * public assets requires a valid session cookie.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;

  const isLogin = pathname === "/login";

  // Already signed in → keep them out of the login screen.
  if (isLogin) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Any other matched route requires a session.
  if (!session) {
    const loginUrl = new URL("/login", request.url);
    if (pathname !== "/") {
      loginUrl.searchParams.set("from", pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next internals, static assets and PWA files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|sw.js|manifest.webmanifest|offline|robots.txt|.*\\.png$|.*\\.svg$).*)",
  ],
};
