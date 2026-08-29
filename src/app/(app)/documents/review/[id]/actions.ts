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
    fiscalPeriod: getText(formData, "fiscalPeriod"),
    fiscalPeriodKind: getText(
      formData,
      "fiscalPeriodKind"
    ) as ReviewDocumentInput["fiscalPeriodKind"],
    id: getText(formData, "id"),
    issuer: getNullableText(formData, "issuer"),
    payee: getNullableText(formData, "payee"),
    paymentDate: getText(formData, "paymentDate"),
    reason: getText(formData, "reason"),
    reference: getNullableText(formData, "reference"),
    userNote: getNullableText(formData, "userNote")
  };

  const document = await reviewDocument(input);
  revalidatePath("/documents");
  revalidatePath("/documents/review");
  redirect(`/documents/${document.id}`);
}

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getNullableText(formData: FormData, key: string): string | null {
  const value = getText(formData, key).trim();
  return value ? value : null;
}
