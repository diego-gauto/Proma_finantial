import { describe, expect, it } from "vitest";

import {
  createSessionToken,
  getPasswordHash,
  getSessionUserId,
  isInternalPath,
  shouldAllowRequest,
  verifyPassword
} from "./auth";

describe("password verification", () => {
  it("accepts the matching password for a stored hash", async () => {
    const hash = await getPasswordHash("correct horse battery staple");

    await expect(
      verifyPassword("correct horse battery staple", hash)
    ).resolves.toBe(true);
  });

  it("rejects a different password for a stored hash", async () => {
    const hash = await getPasswordHash("correct horse battery staple");

    await expect(verifyPassword("wrong password", hash)).resolves.toBe(false);
  });
});

describe("session token", () => {
  it("round-trips the user id with the configured secret", async () => {
    const secret = "a-session-secret-with-at-least-32-chars";
    const token = await createSessionToken("user-123", secret);

    await expect(getSessionUserId(token, secret)).resolves.toBe("user-123");
  });

  it("rejects tokens signed with a different secret", async () => {
    const token = await createSessionToken(
      "user-123",
      "a-session-secret-with-at-least-32-chars"
    );

    await expect(
      getSessionUserId(token, "another-session-secret-with-32-chars")
    ).resolves.toBeNull();
  });
});

describe("route protection", () => {
  it("allows public and framework paths without a session", () => {
    expect(shouldAllowRequest("/auth/login", false)).toBe(true);
    expect(shouldAllowRequest("/_next/static/chunk.js", false)).toBe(true);
    expect(shouldAllowRequest("/favicon.ico", false)).toBe(true);
  });

  it("requires a session for internal paths", () => {
    expect(isInternalPath("/")).toBe(true);
    expect(shouldAllowRequest("/", false)).toBe(false);
    expect(shouldAllowRequest("/documents", false)).toBe(false);
    expect(shouldAllowRequest("/documents", true)).toBe(true);
  });
});
