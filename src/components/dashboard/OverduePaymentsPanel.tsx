import type { ExpectedPeriod } from "@/server/compliance/compliance-types";

export function OverduePaymentsPanel({
  overdue
}: {
  overdue: ExpectedPeriod[];
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <h2>Pagos vencidos no realizados</h2>
      </div>
      <div className="panel-body">
        <PaymentPeriodList emptyText="No hay pagos vencidos." periods={overdue} />
      </div>
    </section>
  );
}

function PaymentPeriodList({
  emptyText,
  periods
}: {
  emptyText: string;
  periods: ExpectedPeriod[];
}) {
  if (!periods.length) {
    return <p className="muted">{emptyText}</p>;
  }

  return (
    <div className="stack-list">
      {periods.slice(0, 8).map((period) => (
        <a
          href={`/documents?categoryId=${period.categoryNodeId}&fiscalPeriod=${period.fiscalPeriod}`}
          key={`${period.categoryNodeId}-${period.fiscalPeriod}-${period.dueDate}`}
        >
          <span>{period.fiscalPeriod}</span>
          <strong>{period.dueDate}</strong>
        </a>
      ))}
    </div>
  );
}
