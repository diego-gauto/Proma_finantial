"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

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

  let authenticated = false;

  try {
    const { createSessionToken, sessionCookieName, verifyPassword } =
      await import("@/server/auth/auth");
    const { getServerEnv } = await import("@/server/env");
    const { findUserByEmail } = await import(
      "@/server/users/users.repository"
    );
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
    authenticated = true;
  } catch {
    return {
      error: "No se pudo validar el acceso. Revisá la configuración del servidor."
    };
  }

  if (authenticated) {
    redirect("/");
  }

  return { error: "No se pudo validar el acceso." };
}
