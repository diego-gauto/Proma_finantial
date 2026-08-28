import { Button } from "@/components/ui/Button";
import type { ComplianceStatus } from "@/server/compliance/compliance-types";

export function DuplicateDocumentsCard({
  duplicates
}: {
  duplicates: ComplianceStatus["duplicates"];
}) {
  return (
    <section className="metric-panel">
      <div>
        <h2>Posibles duplicados</h2>
        <p className="metric-value">{duplicates.length}</p>
      </div>
      <div className="stack-list">
        {duplicates.slice(0, 4).map((duplicate) => (
          <a
            href={`/documents?categoryId=${duplicate.categoryNodeId}&fiscalPeriod=${duplicate.fiscalPeriod}`}
            key={`${duplicate.categoryNodeId}-${duplicate.fiscalPeriod}`}
          >
            <span>{duplicate.fiscalPeriod}</span>
            <strong>{duplicate.documentIds.length} comprobantes</strong>
          </a>
        ))}
        {!duplicates.length ? <p className="muted">Sin duplicados detectados.</p> : null}
      </div>
      <Button href="/documents?status=duplicates">Ver duplicados</Button>
    </section>
  );
}
