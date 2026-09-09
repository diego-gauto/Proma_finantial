import type { DocumentRow } from "@/db/types";

import styles from "./DocumentReview.module.css";
import { buildDocumentPreviewUrl } from "./document-preview-url";

export function DocumentPreviewPane({ document }: { document: DocumentRow }) {
  const previewUrl = buildDocumentPreviewUrl({
    driveFileId: document.driveFileId,
    driveUrl: document.driveUrl
  });

  return (
    <div className={styles.preview}>
      <div className={styles.previewMeta}>
        <span>
          {document.drivePath ??
            document.fileName ??
            "Documento sin ruta ni nombre de archivo"}
        </span>
        {document.processingError ? (
          <strong>{document.processingError}</strong>
        ) : null}
      </div>
      {previewUrl ? (
        <div className={styles.viewerShell}>
          <iframe
            className={styles.documentFrame}
            src={previewUrl}
            title={`Vista previa de ${document.fileName ?? "documento"}`}
          />
        </div>
      ) : (
        <div className={styles.viewerPlaceholder}>
          <strong>No hay vista previa disponible</strong>
          <span>El documento no tiene enlace de archivo registrado.</span>
        </div>
      )}
    </div>
  );
}
