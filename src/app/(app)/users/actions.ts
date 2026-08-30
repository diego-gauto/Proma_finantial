"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createUser } from "@/server/users/create-user";

export async function createUserAction(formData: FormData) {
  await createUser({
    email: getText(formData, "email"),
    password: getText(formData, "password")
  });

  revalidatePath("/users");
  redirect("/users");
}

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
