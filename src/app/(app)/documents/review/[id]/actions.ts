"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import type { ReviewDocumentInput } from "@/db/documents.repository";
import { reviewDocument } from "@/server/documents/review-document";

export async function reviewDocumentAction(formData: FormData) {
  const input: ReviewDocumentInput = {
    amount: getText(formData, "amount"),
    categoryNodeId: getText(formData, "categoryNodeId"),
    currency: getText(formData, "currency"),
    coveredFiscalMonths: getCoveredFiscalMonths(formData),
    fiscalPeriod: getText(formData, "fiscalPeriod"),
    fiscalPeriodKind: "month",
    id: getText(formData, "id"),
    issuer: getNullableText(formData, "issuer"),
    payee: getNullableText(formData, "payee"),
    paymentDate: getText(formData, "paymentDate"),
    reason: getNullableText(formData, "reason"),
    reference: getNullableText(formData, "reference"),
    userNote: getNullableText(formData, "userNote")
  };

  const document = await reviewDocument(input);
  const redirectTo = getNullableText(formData, "redirectTo");
  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath("/documents/review");
  redirect(getSafeRedirectPath(redirectTo) ?? `/documents/${document.id}`);
}

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getNullableText(formData: FormData, key: string): string | null {
  const value = getText(formData, key).trim();
  return value ? value : null;
}

function getCoveredFiscalMonths(formData: FormData): number[] | null {
  const value = getText(formData, "coveredFiscalMonths");
  const months = value
    .split(/[,;\s]+/)
    .map((item) => Number(item.trim()))
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12);

  return months.length ? [...new Set(months)].sort((a, b) => a - b) : null;
}

function getSafeRedirectPath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}
