"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { createSessionToken, sessionCookieName, verifyPassword } from "@/server/auth/auth";
import { getServerEnv } from "@/server/env";
import { findUserByEmail } from "@/server/users/users.repository";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _previousState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Ingresá email y contraseña." };
  }

  const user = await findUserByEmail(email);
  const validPassword = user
    ? await verifyPassword(password, user.passwordHash)
    : false;

  if (!user || !validPassword) {
    return { error: "Email o contraseña incorrectos." };
  }

  const env = getServerEnv();
  const token = await createSessionToken(user.id, env.SESSION_SECRET);
  const cookieStore = await cookies();

  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });

  redirect("/");
}
