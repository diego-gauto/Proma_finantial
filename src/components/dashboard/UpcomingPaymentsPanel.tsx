import { ComplianceIssueTable } from "@/components/dashboard/ComplianceIssueTable";
import type { CategoryNodeRow } from "@/db/types";
import type { ExpectedPeriod } from "@/server/compliance/compliance-types";
import { buildUpcomingIssueRows } from "@/server/dashboard/compliance-issue-view-model";

export function UpcomingPaymentsPanel({
  categories,
  today,
  upcoming
}: {
  categories: CategoryNodeRow[];
  today: string;
  upcoming: ExpectedPeriod[];
}) {
  const rows = buildUpcomingIssueRows(upcoming, categories, today);

  return (
    <section className="metric-panel">
      <div>
        <h2>Proximos pagos esperados</h2>
        <p className="metric-value">{upcoming.length}</p>
      </div>
      <ComplianceIssueTable
        emptyText="No hay pagos proximos del mes en curso."
        key={rows.map((row) => row.id).join("|")}
        rows={rows}
      />
    </section>
  );
}
