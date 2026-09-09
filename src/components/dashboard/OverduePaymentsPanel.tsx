import { ComplianceIssueTable } from "@/components/dashboard/ComplianceIssueTable";
import type { CategoryNodeRow } from "@/db/types";
import type { ExpectedPeriod } from "@/server/compliance/compliance-types";
import { buildOverdueIssueRows } from "@/server/dashboard/compliance-issue-view-model";

export function OverduePaymentsPanel({
  categories,
  today,
  overdue
}: {
  categories: CategoryNodeRow[];
  today: string;
  overdue: ExpectedPeriod[];
}) {
  const rows = buildOverdueIssueRows(overdue, categories, today);

  return (
    <section className="metric-panel">
      <div>
        <h2>Pagos vencidos no realizados</h2>
        <p className="metric-value">{overdue.length}</p>
      </div>
      <ComplianceIssueTable
        emptyText="No hay pagos vencidos del mes en curso."
        key={rows.map((row) => row.id).join("|")}
        rows={rows}
      />
    </section>
  );
}
