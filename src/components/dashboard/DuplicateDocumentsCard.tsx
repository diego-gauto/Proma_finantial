import { ComplianceIssueTable } from "@/components/dashboard/ComplianceIssueTable";
import type { CategoryNodeRow } from "@/db/types";
import type {
  ComplianceStatus,
  ExpectedPeriod
} from "@/server/compliance/compliance-types";
import { buildDuplicateIssueRows } from "@/server/dashboard/compliance-issue-view-model";

export function DuplicateDocumentsCard({
  categories,
  duplicates,
  expected
}: {
  categories: CategoryNodeRow[];
  duplicates: ComplianceStatus["duplicates"];
  expected: ExpectedPeriod[];
}) {
  const rows = buildDuplicateIssueRows(duplicates, expected, categories);

  return (
    <section className="metric-panel">
      <div>
        <h2>Posibles duplicados</h2>
        <p className="metric-value">{duplicates.length}</p>
      </div>
      <ComplianceIssueTable
        emptyText="Sin duplicados detectados."
        key={rows.map((row) => row.id).join("|")}
        rows={rows}
      />
    </section>
  );
}
