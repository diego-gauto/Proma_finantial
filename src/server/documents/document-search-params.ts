import type { ProcessingStatus } from "@/db/types";

export type DocumentOperationalStatus = "missing" | "duplicates";

export interface ParsedDocumentSearchParams {
  categoryId: string | null;
  fiscalPeriod: string | null;
  paymentDateFrom: string | null;
  paymentDateTo: string | null;
  processingStatus: ProcessingStatus | null;
  search: string | null;
  status: DocumentOperationalStatus | null;
}

type SearchParamValue = string | string[] | undefined;

const processingStatuses = new Set<ProcessingStatus>([
  "error",
  "pending",
  "processed",
  "review_required"
]);

const operationalStatuses = new Set<DocumentOperationalStatus>([
  "duplicates",
  "missing"
]);

export function parseDocumentSearchParams(
  searchParams: Record<string, SearchParamValue>
): ParsedDocumentSearchParams {
  return {
    categoryId: getFirstValue(searchParams.categoryId),
    fiscalPeriod: getFirstValue(searchParams.fiscalPeriod),
    paymentDateFrom: getFirstValue(searchParams.paymentDateFrom),
    paymentDateTo: getFirstValue(searchParams.paymentDateTo),
    processingStatus: parseProcessingStatus(searchParams.processingStatus),
    search: getFirstValue(searchParams.search),
    status: parseOperationalStatus(searchParams.status)
  };
}

function parseProcessingStatus(
  value: SearchParamValue
): ProcessingStatus | null {
  const status = getFirstValue(value);
  return status && processingStatuses.has(status as ProcessingStatus)
    ? (status as ProcessingStatus)
    : null;
}

function parseOperationalStatus(
  value: SearchParamValue
): DocumentOperationalStatus | null {
  const status = getFirstValue(value);
  return status && operationalStatuses.has(status as DocumentOperationalStatus)
    ? (status as DocumentOperationalStatus)
    : null;
}

function getFirstValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}
