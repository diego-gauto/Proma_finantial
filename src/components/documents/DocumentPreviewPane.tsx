import { Button } from "@/components/ui/Button";
import type { DocumentRow } from "@/db/types";

import styles from "./DocumentReview.module.css";

export function DocumentPreviewPane({ document }: { document: DocumentRow }) {
  return (
    <div className={styles.preview}>
      <div className={styles.previewMeta}>
        <span>{document.fileName ?? "Documento sin nombre de archivo"}</span>
        <span>{document.drivePath ?? "Sin ruta de Drive registrada"}</span>
        {document.processingError ? (
          <strong>{document.processingError}</strong>
        ) : null}
      </div>
      {document.driveUrl ? (
        <Button href={document.driveUrl} variant="primary">
          Abrir en Drive
        </Button>
      ) : null}
      <div className={styles.rawText}>
        {document.rawText ?? "No hay texto extraido para este documento."}
      </div>
    </div>
  );
}
