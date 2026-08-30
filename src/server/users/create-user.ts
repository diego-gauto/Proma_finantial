import { getPasswordHash } from "@/server/auth/auth";

import {
  createUserRecord,
  findUserByEmail,
  toPublicUser,
  type CreateUserRecordInput,
  type PublicUser,
  type User
} from "./users.repository";

export interface CreateUserInput {
  email: string;
  password: string;
}

interface CreateUserDependencies {
  createUserRecord: (input: CreateUserRecordInput) => Promise<User>;
  findUserByEmail: (email: string) => Promise<User | null>;
  getPasswordHash: (password: string) => Promise<string>;
}

const defaultDependencies: CreateUserDependencies = {
  createUserRecord,
  findUserByEmail,
  getPasswordHash
};

export async function createUser(
  input: CreateUserInput,
  dependencies: CreateUserDependencies = defaultDependencies
): Promise<PublicUser> {
  const email = input.email.trim().toLowerCase();
  const password = input.password.trim();

  if (!email.includes("@")) {
    throw new Error("Mail invalido.");
  }

  if (password.length < 6) {
    throw new Error("La clave debe tener al menos 6 caracteres.");
  }

  const existingUser = await dependencies.findUserByEmail(email);
  if (existingUser) {
    throw new Error("Ya existe un usuario con ese mail.");
  }

  const passwordHash = await dependencies.getPasswordHash(password);
  const user = await dependencies.createUserRecord({ email, passwordHash });
  return toPublicUser(user);
}
