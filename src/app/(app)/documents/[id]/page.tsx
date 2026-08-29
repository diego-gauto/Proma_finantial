import { notFound } from "next/navigation";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { getDocumentById } from "@/db/documents.repository";
import {
  buildDocumentTableRows,
  getDocumentStatusLabel
} from "@/server/documents/document-display";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function DocumentDetailPage({
  params
}: DocumentDetailPageProps) {
  const { id } = await params;
  const [categories, document] = await Promise.all([
    listCategoryNodes(),
    getDocumentById(id)
  ]);

  if (!document) {
    notFound();
  }

  const row = buildDocumentTableRows(categories, [document])[0];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>{document.reason ?? "Documento"}</h1>
          <p>{row.categoryLabel}</p>
        </div>
        <div className={styles.actions}>
          {row.reviewHref ? (
            <Button href={row.reviewHref} variant="primary">
              Revisar
            </Button>
          ) : null}
          {document.driveUrl ? (
            <Button href={document.driveUrl}>Abrir en Drive</Button>
          ) : null}
          <Button href="/documents">Volver a documentos</Button>
        </div>
      </div>

      <Card title="Datos operativos">
        <div className={styles.grid}>
          <DetailField
            label="Estado"
            value={getDocumentStatusLabel(document.processingStatus)}
          />
          <DetailField label="Monto" value={row.amountLabel} />
          <DetailField label="Periodo fiscal" value={row.fiscalPeriod} />
          <DetailField label="Fecha de pago" value={row.paymentDate} />
          <DetailField label="Identificador / operacion" value={row.reference} />
          <DetailField label="Entidad" value={row.entity} />
          <DetailField label="Archivo" value={document.fileName ?? "Sin archivo"} />
          <DetailField label="Ruta Drive" value={document.drivePath ?? "Sin ruta"} />
        </div>
      </Card>

      {document.processingError ? (
        <Card title="Error de procesamiento">
          <p>{document.processingError}</p>
        </Card>
      ) : null}

      <Card title="Texto extraido">
        <div className={styles.rawText}>
          {document.rawText ?? "No hay texto extraido registrado."}
        </div>
      </Card>

      <Card title="Datos extraidos">
        <pre className={styles.jsonBlock}>
          {JSON.stringify(document.extractedData, null, 2)}
        </pre>
      </Card>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.field}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
