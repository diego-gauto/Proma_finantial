import { describe, expect, it } from "vitest";

import { createUser } from "./create-user";
import type { User } from "./users.repository";

const existingUser: User = {
  createdAt: "2026-08-29T00:00:00.000Z",
  email: "ventas@promatexsrl.com",
  id: "user-1",
  passwordHash: "hash",
  updatedAt: "2026-08-29T00:00:00.000Z"
};

describe("createUser", () => {
  it("normalizes email, hashes password and does not expose the hash", async () => {
    let receivedHash = "";
    const created = await createUser(
      {
        email: "  Nuevo@PromatexSRL.com ",
        password: "promatex-2"
      },
      {
        createUserRecord: async (input) => {
          receivedHash = input.passwordHash;
          return {
            ...existingUser,
            email: input.email,
            id: "user-2",
            passwordHash: input.passwordHash
          };
        },
        findUserByEmail: async () => null,
        getPasswordHash: async (password) => `hashed:${password}`
      }
    );

    expect(receivedHash).toBe("hashed:promatex-2");
    expect(created).toEqual({
      createdAt: "2026-08-29T00:00:00.000Z",
      email: "nuevo@promatexsrl.com",
      id: "user-2",
      updatedAt: "2026-08-29T00:00:00.000Z"
    });
  });

  it("rejects duplicate emails", async () => {
    await expect(
      createUser(
        {
          email: "ventas@promatexsrl.com",
          password: "promatex"
        },
        {
          createUserRecord: async () => existingUser,
          findUserByEmail: async () => existingUser,
          getPasswordHash: async () => "hash"
        }
      )
    ).rejects.toThrow("Ya existe un usuario con ese mail.");
  });
});
