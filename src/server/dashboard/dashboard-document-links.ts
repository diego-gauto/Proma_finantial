import { buildDashboardQuery, type DashboardFilters } from "./dashboard-filters";

export function buildDashboardDocumentReviewHref(
  documentId: string | null,
  filters: DashboardFilters
): string {
  const queryHref = buildDashboardQuery(filters);
  const baseHref = queryHref.startsWith("?") ? `/${queryHref}` : queryHref;

  if (!documentId) {
    return baseHref;
  }

  const separator = baseHref.includes("?") ? "&" : "?";
  return `${baseHref}${separator}reviewDocumentId=${encodeURIComponent(
    documentId
  )}`;
}
