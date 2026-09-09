import type { ComplianceStatus, ExpectedPeriod } from "./compliance-types";

export function getUpcomingPayments(
  status: ComplianceStatus,
  today: string
): ExpectedPeriod[] {
  return status.unpaid
    .filter(
      (period) =>
        isInCurrentMonth(period.dueDate, today) &&
        period.dueDate.localeCompare(today) >= 0
    )
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

function isInCurrentMonth(date: string, today: string): boolean {
  return date.slice(0, 7) === today.slice(0, 7);
}
