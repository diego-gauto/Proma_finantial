import { Button } from "@/components/ui/Button";
import type { ExpectedPeriod } from "@/server/compliance/compliance-types";

export function MissingDocumentsCard({
  missing
}: {
  missing: ExpectedPeriod[];
}) {
  return (
    <section className="metric-panel">
      <div>
        <h2>Posibles faltantes</h2>
        <p className="metric-value">{missing.length}</p>
      </div>
      <div className="stack-list">
        {missing.slice(0, 4).map((period) => (
          <a
            href={`/documents?categoryId=${period.categoryNodeId}&fiscalPeriod=${period.fiscalPeriod}`}
            key={`${period.categoryNodeId}-${period.fiscalPeriod}`}
          >
            <span>{period.fiscalPeriod}</span>
            <strong>{period.dueDate}</strong>
          </a>
        ))}
        {!missing.length ? <p className="muted">Sin faltantes vencidos.</p> : null}
      </div>
      <Button href="/documents?status=missing">Ver faltantes</Button>
    </section>
  );
}
