export const sessionCookieName = "fd_session";

export function isInternalPath(pathname: string): boolean {
  return !(
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname.startsWith("/api")
  );
}

export function shouldAllowRequest(
  pathname: string,
  hasSession: boolean
): boolean {
  return !isInternalPath(pathname) || hasSession;
}
