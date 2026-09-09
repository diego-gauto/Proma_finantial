import type { CategoryNodeRow, DocumentRow } from "@/db/types";
import { getCategoryBreadcrumbs } from "@/server/categories/category-tree";

export interface DocumentTableRow {
  amountLabel: string;
  categoryPath: string[];
  detailHref: string;
  documentTitle: string;
  fiscalPeriod: string;
  id: string;
  paymentDate: string;
  processingStatus: DocumentRow["processingStatus"];
  reference: string;
  reviewHref: string | null;
  unresolvedFields: string[];
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
    categoryPath: getDocumentCategoryPath(categories, document),
    detailHref: `/documents/${document.id}`,
    documentTitle: getDocumentTitle(document),
    fiscalPeriod: document.fiscalPeriod ?? "Sin periodo",
    id: document.id,
    paymentDate: document.paymentDate ?? "Sin fecha",
    processingStatus: document.processingStatus,
    reference: document.reference ?? document.fileName ?? "Sin identificador",
    reviewHref:
      document.processingStatus === "review_required" ||
      document.processingStatus === "error"
        ? `/documents/review/${document.id}`
        : null,
    unresolvedFields: getDocumentReviewIssues(document)
  }));
}

export function getDocumentReviewIssues(document: DocumentRow): string[] {
  const issues: string[] = [];

  if (!document.categoryNodeId) {
    issues.push("Categoria");
  }

  if (
    !document.fiscalPeriod ||
    document.fiscalPeriodKind === "unknown" ||
    !/^\d{4}-\d{2}$/.test(document.fiscalPeriod)
  ) {
    issues.push("Periodo fiscal");
  }

  if (!document.paymentDate) {
    issues.push("Fecha de pago");
  }

  if (!document.amount) {
    issues.push("Monto");
  }

  return issues;
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

function getDocumentCategoryPath(
  categories: CategoryNodeRow[],
  document: DocumentRow
): string[] {
  if (!document.categoryNodeId) {
    return ["Sin categoria"];
  }

  const breadcrumbs = getCategoryBreadcrumbs(categories, document.categoryNodeId);
  return breadcrumbs.length ? breadcrumbs : ["Sin categoria"];
}

function getDocumentTitle(document: DocumentRow): string {
  return (
    document.fileName ??
    document.reference ??
    document.reason ??
    "Documento sin nombre"
  );
}
