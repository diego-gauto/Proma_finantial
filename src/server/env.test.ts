import { describe, expect, it } from "vitest";

import { readServerEnv } from "./env";

describe("readServerEnv", () => {
  it("accepts a PostgreSQL database URL and strong session secret", () => {
    const env = readServerEnv({
      DATABASE_URL: "postgresql://app:secret@localhost:55432/financial_dashboard",
      METABASE_SITE_URL: "http://localhost:3000",
      SESSION_SECRET: "a-session-secret-with-at-least-32-chars"
    });

    expect(env.DATABASE_URL).toBe(
      "postgresql://app:secret@localhost:55432/financial_dashboard"
    );
    expect(env.SESSION_SECRET).toBe("a-session-secret-with-at-least-32-chars");
    expect(env.METABASE_SITE_URL).toBe("http://localhost:3000");
  });

  it("accepts empty optional Metabase settings", () => {
    const env = readServerEnv({
      DATABASE_URL: "postgresql://app:secret@localhost:55432/financial_dashboard",
      METABASE_SITE_URL: "",
      SESSION_SECRET: "a-session-secret-with-at-least-32-chars"
    });

    expect(env.METABASE_SITE_URL).toBeNull();
  });

  it("accepts empty optional Drive webhook settings", () => {
    const env = readServerEnv({
      DATABASE_URL: "postgresql://app:secret@localhost:55432/financial_dashboard",
      SESSION_SECRET: "a-session-secret-with-at-least-32-chars",
      GOOGLE_DRIVE_WEBHOOK_CHANNEL_ID: "",
      GOOGLE_DRIVE_WEBHOOK_TOKEN: "",
      GOOGLE_DRIVE_WEBHOOK_URL: "",
      N8N_DRIVE_INCREMENTAL_WEBHOOK_URL: "",
      N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN: ""
    });

    expect(env.GOOGLE_DRIVE_WEBHOOK_CHANNEL_ID).toBeNull();
    expect(env.GOOGLE_DRIVE_WEBHOOK_TOKEN).toBeNull();
    expect(env.GOOGLE_DRIVE_WEBHOOK_URL).toBeNull();
    expect(env.N8N_DRIVE_INCREMENTAL_WEBHOOK_URL).toBeNull();
    expect(env.N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN).toBeNull();
  });

  it("accepts configured Drive webhook settings", () => {
    const env = readServerEnv({
      DATABASE_URL: "postgresql://app:secret@localhost:55432/financial_dashboard",
      SESSION_SECRET: "a-session-secret-with-at-least-32-chars",
      GOOGLE_DRIVE_WEBHOOK_CHANNEL_ID: "drive-channel",
      GOOGLE_DRIVE_WEBHOOK_TOKEN: "drive-token",
      GOOGLE_DRIVE_WEBHOOK_URL:
        "https://app.example.com/api/v1/drive/webhook",
      N8N_DRIVE_INCREMENTAL_WEBHOOK_URL:
        "https://n8n.example.com/webhook/drive-incremental",
      N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN: "n8n-token"
    });

    expect(env.GOOGLE_DRIVE_WEBHOOK_CHANNEL_ID).toBe("drive-channel");
    expect(env.GOOGLE_DRIVE_WEBHOOK_TOKEN).toBe("drive-token");
    expect(env.GOOGLE_DRIVE_WEBHOOK_URL).toBe(
      "https://app.example.com/api/v1/drive/webhook"
    );
    expect(env.N8N_DRIVE_INCREMENTAL_WEBHOOK_URL).toBe(
      "https://n8n.example.com/webhook/drive-incremental"
    );
    expect(env.N8N_DRIVE_INCREMENTAL_WEBHOOK_TOKEN).toBe("n8n-token");
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
