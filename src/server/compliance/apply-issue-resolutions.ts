import type {
  ComplianceIssueResolution,
  ComplianceStatus,
  ExpectedPeriod
} from "./compliance-types";

type DuplicateIssue = ComplianceStatus["duplicates"][number];

export function applyComplianceIssueResolutions(
  status: ComplianceStatus,
  resolutions: ComplianceIssueResolution[]
): ComplianceStatus {
  const activeResolutions = resolutions.filter((resolution) => resolution.active);
  const resolvedMissing = new Set(
    activeResolutions
      .filter((resolution) => resolution.issueType === "missing")
      .map((resolution) => resolution.fingerprint)
  );
  const resolvedDuplicates = new Set(
    activeResolutions
      .filter((resolution) => resolution.issueType === "duplicate")
      .map((resolution) => resolution.fingerprint)
  );
  const filterMissingPeriods = (periods: ExpectedPeriod[]) =>
    periods.filter(
      (period) => !resolvedMissing.has(buildMissingIssueFingerprint(period))
    );

  return {
    ...status,
    missing: filterMissingPeriods(status.missing),
    overdue: filterMissingPeriods(status.overdue),
    unpaid: filterMissingPeriods(status.unpaid),
    upcoming: filterMissingPeriods(status.upcoming),
    duplicates: status.duplicates.filter(
      (duplicate) =>
        !resolvedDuplicates.has(buildDuplicateIssueFingerprint(duplicate))
    )
  };
}

export function buildMissingIssueFingerprint(period: ExpectedPeriod): string {
  return [
    "missing",
    period.categoryNodeId,
    period.fiscalPeriod,
    period.fiscalPeriodKind,
    period.rule.id
  ].join(":");
}

export function buildDuplicateIssueFingerprint(
  duplicate: DuplicateIssue
): string {
  return [
    "duplicate",
    duplicate.categoryNodeId,
    duplicate.fiscalPeriod,
    duplicate.fiscalPeriodKind,
    getDuplicateDocumentIds(duplicate).join(",")
  ].join(":");
}

export function getDuplicateDocumentIds(duplicate: DuplicateIssue): string[] {
  return duplicate.documents
    .map((document) => document.id)
    .sort((left, right) => left.localeCompare(right));
}
