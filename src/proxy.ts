import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName, shouldAllowRequest } from "@/server/auth/route-protection";

export function proxy(request: NextRequest) {
  const hasSession = Boolean(request.cookies.get(sessionCookieName)?.value);
  const { pathname } = request.nextUrl;

  if (shouldAllowRequest(pathname, hasSession)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/auth/login";
  loginUrl.searchParams.set("next", pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
