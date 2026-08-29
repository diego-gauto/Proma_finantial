import { DocumentsTable } from "@/components/documents/DocumentsTable";
import type { DocumentTableRow } from "@/server/documents/document-display";

interface ReviewQueueProps {
  rows: DocumentTableRow[];
}

export function ReviewQueue({ rows }: ReviewQueueProps) {
  return (
    <DocumentsTable
      emptyText="No hay documentos pendientes de revision."
      rows={rows}
    />
  );
}
