import { describe, expect, it } from "vitest";

import { readServerEnv } from "./env";

describe("readServerEnv", () => {
  it("accepts a PostgreSQL database URL and strong session secret", () => {
    const env = readServerEnv({
      DATABASE_URL: "postgresql://app:secret@localhost:55432/financial_dashboard",
      SESSION_SECRET: "a-session-secret-with-at-least-32-chars"
    });

    expect(env.DATABASE_URL).toBe(
      "postgresql://app:secret@localhost:55432/financial_dashboard"
    );
    expect(env.SESSION_SECRET).toBe("a-session-secret-with-at-least-32-chars");
  });

  it("rejects an invalid database URL", () => {
    expect(() =>
      readServerEnv({
        DATABASE_URL: "not-a-url",
        SESSION_SECRET: "a-session-secret-with-at-least-32-chars"
      })
    ).toThrow("Invalid server environment");
  });

  it("rejects short session secrets", () => {
    expect(() =>
      readServerEnv({
        DATABASE_URL: "postgresql://app:secret@localhost:55432/financial_dashboard",
        SESSION_SECRET: "short"
      })
    ).toThrow("Invalid server environment");
  });
});
