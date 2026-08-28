import { getDbPool } from "@/db/client";

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const result = await getDbPool().query<UserRow>(
    `
      select id, email, password_hash, created_at, updated_at
      from users
      where lower(email) = lower($1)
      limit 1
    `,
    [email.trim()]
  );

  const [row] = result.rows;
  return row ? toUser(row) : null;
}
