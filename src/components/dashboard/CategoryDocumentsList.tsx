import type { DocumentRow } from "@/db/types";
import { buildDashboardDocumentReviewHref } from "@/server/dashboard/dashboard-document-links";
import type { DashboardFilters } from "@/server/dashboard/dashboard-filters";
import { getDocumentStatusLabel } from "@/server/documents/document-display";

import styles from "./CategoryDocumentsList.module.css";

export function CategoryDocumentsList({
  documents,
  filters
}: {
  documents: DocumentRow[];
  filters: DashboardFilters;
}) {
  if (!documents.length) {
    return (
      <div className={styles.empty}>
        No hay documentos para esta categoria y periodo.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Documentos de la categoria</h3>
        <span>{documents.length} documentos</span>
      </div>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Periodo fiscal</th>
              <th>Fecha de pago</th>
              <th>Importe</th>
              <th>Estado</th>
              <th>Documento</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td data-label="Periodo fiscal">
                  {document.fiscalPeriod ?? "Sin periodo"}
                </td>
                <td data-label="Fecha de pago">
                  {document.paymentDate ?? "Sin fecha"}
                </td>
                <td data-label="Importe">{formatCurrency(document.amount)}</td>
                <td data-label="Estado">
                  {getDocumentStatusLabel(document.processingStatus)}
                </td>
                <td data-label="Documento">
                  <a href={buildDashboardDocumentReviewHref(document.id, filters)}>
                    Revisar
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function formatCurrency(amount: string | null): string {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(Number(amount ?? 0));
}
