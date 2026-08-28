import type { ComplianceStatus, ExpectedPeriod } from "./compliance-types";

export function getOverduePayments(status: ComplianceStatus): ExpectedPeriod[] {
  return [...status.overdue].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
