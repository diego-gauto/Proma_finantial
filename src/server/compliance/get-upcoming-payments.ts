import type { ComplianceStatus, ExpectedPeriod } from "./compliance-types";

export function getUpcomingPayments(status: ComplianceStatus): ExpectedPeriod[] {
  return [...status.upcoming].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}
