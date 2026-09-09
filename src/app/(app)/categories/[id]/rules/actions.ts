"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  closePaymentRule,
  listPaymentRules,
  replaceActivePaymentRule,
  updatePaymentRule
} from "@/db/payment-rules.repository";
import { parsePaymentRuleForm } from "@/server/payment-rules/payment-rule-form";
import {
  assertOpenRuleHasAtLeastOneMonthOfValidity,
  assertRuleDoesNotOverlap
} from "@/server/payment-rules/rule-overlap";

export async function createPaymentRuleAction(formData: FormData) {
  const input = parsePaymentRuleForm(Object.fromEntries(formData.entries()));
  const existingRules = await listPaymentRules();
  assertOpenRuleHasAtLeastOneMonthOfValidity(input, existingRules);
  const rulesToValidate = existingRules.filter(
    (rule) =>
      !(
        rule.categoryNodeId === input.categoryNodeId &&
        rule.active &&
        !rule.activeTo &&
        rule.activeFrom < input.activeFrom
      )
  );

  assertRuleDoesNotOverlap(input, rulesToValidate);
  await replaceActivePaymentRule(input);
  revalidatePath("/categories");
  revalidatePath(`/categories/${input.categoryNodeId}`);
  redirect(`/categories/${input.categoryNodeId}`);
}

export async function updatePaymentRuleAction(formData: FormData) {
  const ruleId = getText(formData, "ruleId");
  const input = parsePaymentRuleForm(Object.fromEntries(formData.entries()));

  if (!ruleId) {
    throw new Error("Falta la regla para editar.");
  }

  const existingRules = await listPaymentRules();
  assertRuleDoesNotOverlap(
    input,
    existingRules.filter((rule) => rule.id !== ruleId)
  );
  await updatePaymentRule(ruleId, input);
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
