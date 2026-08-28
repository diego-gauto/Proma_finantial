import { describe, expect, it } from "vitest";

import { toUser } from "./users.repository";

describe("toUser", () => {
  it("maps a database user row to the application shape", () => {
    expect(
      toUser({
        id: "user-1",
        email: "owner@example.com",
        password_hash: "hash",
        created_at: new Date("2026-08-28T12:00:00.000Z"),
        updated_at: new Date("2026-08-28T12:30:00.000Z")
      })
    ).toEqual({
      id: "user-1",
      email: "owner@example.com",
      passwordHash: "hash",
      createdAt: "2026-08-28T12:00:00.000Z",
      updatedAt: "2026-08-28T12:30:00.000Z"
    });
  });
});
