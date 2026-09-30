import { ComplianceIssueTable } from "@/components/dashboard/ComplianceIssueTable";
import type { CategoryNodeRow } from "@/db/types";
import type { ExpectedPeriod } from "@/server/compliance/compliance-types";
import { buildMissingIssueRows } from "@/server/dashboard/compliance-issue-view-model";

export function MissingDocumentsCard({
  categories,
  missing,
  resolveAction
}: {
  categories: CategoryNodeRow[];
  missing: ExpectedPeriod[];
  resolveAction?: (formData: FormData) => void | Promise<void>;
}) {
  const rows = buildMissingIssueRows(missing, categories);

  return (
    <section className="metric-panel">
      <div>
        <h2>Posibles faltantes</h2>
        <p className="metric-value">{missing.length}</p>
      </div>
      <ComplianceIssueTable
        emptyText="Sin faltantes vencidos."
        key={rows.map((row) => row.id).join("|")}
        resolveAction={resolveAction}
        rows={rows}
      />
    </section>
  );
}
