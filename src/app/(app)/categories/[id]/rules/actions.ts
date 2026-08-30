"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  closePaymentRule,
  createPaymentRule
} from "@/db/payment-rules.repository";
import { parsePaymentRuleForm } from "@/server/payment-rules/payment-rule-form";

export async function createPaymentRuleAction(formData: FormData) {
  const input = parsePaymentRuleForm(Object.fromEntries(formData.entries()));
  await createPaymentRule(input);
  revalidatePath("/categories");
  revalidatePath(`/categories/${input.categoryNodeId}`);
  redirect(`/categories/${input.categoryNodeId}`);
}

export async function closePaymentRuleAction(formData: FormData) {
  const ruleId = getText(formData, "ruleId");
  const categoryNodeId = getText(formData, "categoryNodeId");
  const activeTo = getText(formData, "activeTo");

  if (!ruleId || !categoryNodeId || !activeTo) {
    throw new Error("Faltan datos para cerrar la regla.");
  }

  await closePaymentRule(ruleId, activeTo);
  revalidatePath("/categories");
  revalidatePath(`/categories/${categoryNodeId}`);
  redirect(`/categories/${categoryNodeId}`);
}

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
