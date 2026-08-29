import type { DocumentRow } from "@/db/types";

import styles from "./CategoryDocumentsList.module.css";

export function CategoryDocumentsList({
  documents
}: {
  documents: DocumentRow[];
}) {
  const processedDocuments = documents.filter(
    (document) => document.processingStatus === "processed"
  );

  if (!processedDocuments.length) {
    return (
      <div className={styles.empty}>
        No hay documentos procesados para esta categoria.
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h3>Documentos de la categoria</h3>
        <span>{processedDocuments.length} pagos</span>
      </div>
      <div className={styles.list}>
        {processedDocuments.map((document) => (
          <article className={styles.row} key={document.id}>
            <div>
              <strong>{document.reference ?? document.id}</strong>
              <span>{document.payee ?? document.issuer ?? "Sin entidad"}</span>
            </div>
            <div>
              <span>{document.fiscalPeriod ?? "Sin periodo"}</span>
              <span>{document.paymentDate ?? "Sin fecha"}</span>
            </div>
            <strong>{formatCurrency(document.amount)}</strong>
          </article>
        ))}
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
