import type { ExpectedPeriod } from "@/server/compliance/compliance-types";

export function UpcomingPaymentsPanel({
  upcoming
}: {
  upcoming: ExpectedPeriod[];
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Proximos pagos esperados</h2>
      </div>
      <div className="panel-body">
        {upcoming.length ? (
          <div className="stack-list">
            {upcoming.slice(0, 8).map((period) => (
              <a
                href={`/documents?categoryId=${period.categoryNodeId}&fiscalPeriod=${period.fiscalPeriod}`}
                key={`${period.categoryNodeId}-${period.fiscalPeriod}-${period.dueDate}`}
              >
                <span>{period.fiscalPeriod}</span>
                <strong>{period.dueDate}</strong>
              </a>
            ))}
          </div>
        ) : (
          <p className="muted">No hay pagos dentro de la ventana de aviso.</p>
        )}
      </div>
    </section>
  );
}
