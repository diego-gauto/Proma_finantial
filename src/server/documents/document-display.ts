import type { CategoryNodeRow, DocumentRow } from "@/db/types";
import { getCategoryBreadcrumbs } from "@/server/categories/category-tree";

export interface DocumentTableRow {
  amountLabel: string;
  categoryLabel: string;
  detailHref: string;
  driveHref: string | null;
  entity: string;
  fiscalPeriod: string;
  id: string;
  paymentDate: string;
  processingStatus: DocumentRow["processingStatus"];
  reason: string;
  reference: string;
  reviewHref: string | null;
}

const statusLabels: Record<DocumentRow["processingStatus"], string> = {
  error: "Error",
  pending: "Pendiente",
  processed: "Procesado",
  review_required: "Requiere revision"
};

export function buildDocumentTableRows(
  categories: CategoryNodeRow[],
  documents: DocumentRow[]
): DocumentTableRow[] {
  return documents.map((document) => ({
    amountLabel: formatDocumentAmount(document),
    categoryLabel: getDocumentCategoryLabel(categories, document),
    detailHref: `/documents/${document.id}`,
    driveHref: document.driveUrl,
    entity: getDocumentEntity(document),
    fiscalPeriod: document.fiscalPeriod ?? "Sin periodo",
    id: document.id,
    paymentDate: document.paymentDate ?? "Sin fecha",
    processingStatus: document.processingStatus,
    reason: document.reason ?? "Sin motivo",
    reference: document.reference ?? document.fileName ?? "Sin identificador",
    reviewHref:
      document.processingStatus === "review_required" ||
      document.processingStatus === "error"
        ? `/documents/review/${document.id}`
        : null
  }));
}

export function getDocumentEntity(document: DocumentRow): string {
  return document.issuer ?? document.payee ?? "Sin entidad";
}

export function getDocumentStatusLabel(
  status: DocumentRow["processingStatus"]
): string {
  return statusLabels[status];
}

export function formatDocumentAmount(document: DocumentRow): string {
  const amount = document.amount ? Number(document.amount) : null;
  if (amount === null || Number.isNaN(amount)) {
    return "Sin monto";
  }

  const value = new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  }).format(amount);

  return `${document.currency === "USD" ? "USD" : "$"} ${value}`;
}

function getDocumentCategoryLabel(
  categories: CategoryNodeRow[],
  document: DocumentRow
): string {
  if (!document.categoryNodeId) {
    return "Sin categoria";
  }

  const breadcrumbs = getCategoryBreadcrumbs(categories, document.categoryNodeId);
  return breadcrumbs.length ? breadcrumbs.join(" / ") : "Sin categoria";
}
