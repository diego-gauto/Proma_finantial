"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createComplianceIssueResolution } from "@/db/compliance-issue-resolutions.repository";
import type { FiscalPeriodKind } from "@/db/types";
import type {
  ComplianceIssueResolutionKind,
  ComplianceIssueType
} from "@/server/compliance/compliance-types";
import { getSessionUserId, sessionCookieName } from "@/server/auth/auth";
import { getServerEnv } from "@/server/env";

export async function resolveComplianceIssueAction(formData: FormData) {
  const issueType = getIssueType(formData);
  const duplicateDocumentIds = getDuplicateDocumentIds(formData);

  await createComplianceIssueResolution({
    issueType,
    categoryNodeId: getRequiredText(formData, "categoryNodeId"),
    duplicateDocumentIds,
    fingerprint: getRequiredText(formData, "fingerprint"),
    fiscalPeriod: getRequiredText(formData, "fiscalPeriod"),
    fiscalPeriodKind: getFiscalPeriodKind(formData),
    note: getNullableText(formData, "note"),
    paymentRuleId: getNullableText(formData, "paymentRuleId"),
    resolutionKind: getResolutionKind(formData),
    resolvedByUserId: await getCurrentUserId()
  });

  revalidatePath("/");
  redirect(getSafeRedirectPath(getNullableText(formData, "redirectTo")) ?? "/");
}

async function getCurrentUserId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookieName)?.value;

    if (!token) {
      return null;
    }

    return getSessionUserId(token, getServerEnv().SESSION_SECRET);
  } catch {
    return null;
  }
}

function getIssueType(formData: FormData): ComplianceIssueType {
  const value = getRequiredText(formData, "issueType");

  if (value !== "missing" && value !== "duplicate") {
    throw new Error("Tipo de incidencia invalido.");
  }

  return value;
}

function getFiscalPeriodKind(formData: FormData): FiscalPeriodKind {
  const value = getRequiredText(formData, "fiscalPeriodKind");

  if (value !== "month" && value !== "year" && value !== "unknown") {
    throw new Error("Tipo de periodo fiscal invalido.");
  }

  return value;
}

function getResolutionKind(formData: FormData): ComplianceIssueResolutionKind {
  const value = getNullableText(formData, "resolutionKind") ?? "acknowledged";

  if (
    value !== "acknowledged" &&
    value !== "waived" &&
    value !== "compensated_next_period"
  ) {
    throw new Error("Tipo de resolucion invalido.");
  }

  return value;
}

function getDuplicateDocumentIds(formData: FormData): string[] | null {
  const value = getNullableText(formData, "duplicateDocumentIds");

  if (!value) {
    return null;
  }

  const ids = value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return ids.length ? ids : null;
}

function getRequiredText(formData: FormData, key: string): string {
  const value = getNullableText(formData, key);

  if (!value) {
    throw new Error(`Falta ${key}.`);
  }

  return value;
}

function getNullableText(formData: FormData, key: string): string | null {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function getSafeRedirectPath(path: string | null): string | null {
  if (!path || !path.startsWith("/") || path.startsWith("//")) {
    return null;
  }

  return path;
}
