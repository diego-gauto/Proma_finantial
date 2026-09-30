import { describe, expect, it } from "vitest";

import {
  applyComplianceIssueResolutions,
  buildDuplicateIssueFingerprint,
  buildMissingIssueFingerprint
} from "./apply-issue-resolutions";
import type {
  ComplianceIssueResolution,
  ComplianceRule,
  ComplianceStatus,
  ExpectedPeriod
} from "./compliance-types";

const rule: ComplianceRule = {
  id: "rule-1",
  categoryNodeId: "category-1",
  appliesToDescendants: false,
  name: "Mensual",
  cadence: "monthly",
  customPeriodMonths: null,
  anchorPeriodMonth: 1,
  fiscalPeriodKind: "month",
  paymentMonth: null,
  paymentDay: 10,
  paymentYearOffset: 0,
  paymentMonthOffset: 1,
  activeFrom: "2026-01-01",
  activeTo: null,
  graceDays: 5,
  reminderDaysBefore: 7,
  active: true,
  notes: null
};

const missingPeriod: ExpectedPeriod = {
  categoryNodeId: "category-1",
  dueDate: "2026-07-10",
  fiscalPeriod: "2026-06",
  fiscalPeriodKind: "month",
  rule
};

const duplicate = {
  categoryNodeId: "category-2",
  fiscalPeriod: "2026-08",
  fiscalPeriodKind: "month" as const,
  documents: [
    {
      id: "doc-b",
      amount: "109823.34",
      currency: "ARS",
      fileName: "08-2026.pdf",
      paymentDate: "2026-08-10"
    },
    {
      id: "doc-a",
      amount: "109823.34",
      currency: "ARS",
      fileName: "08-26.pdf",
      paymentDate: "2026-08-03"
    }
  ]
};

const baseStatus: ComplianceStatus = {
  duplicates: [duplicate],
  expected: [missingPeriod],
  missing: [missingPeriod],
  overdue: [missingPeriod],
  unpaid: [missingPeriod],
  upcoming: []
};

function resolution(
  input: Pick<
    ComplianceIssueResolution,
    | "categoryNodeId"
    | "duplicateDocumentIds"
    | "fiscalPeriod"
    | "fiscalPeriodKind"
    | "fingerprint"
    | "issueType"
    | "paymentRuleId"
  >
): ComplianceIssueResolution {
  return {
    id: "resolution-1",
    active: true,
    createdAt: "2026-09-30T12:00:00.000Z",
    note: null,
    resolutionKind: "acknowledged",
    resolvedAt: "2026-09-30T12:00:00.000Z",
    resolvedByUserId: null,
    ...input
  };
}

describe("applyComplianceIssueResolutions", () => {
  it("hides resolved missing periods from missing, overdue and unpaid lists", () => {
    const filtered = applyComplianceIssueResolutions(baseStatus, [
      resolution({
        categoryNodeId: "category-1",
        duplicateDocumentIds: null,
        fiscalPeriod: "2026-06",
        fiscalPeriodKind: "month",
        fingerprint: buildMissingIssueFingerprint(missingPeriod),
        issueType: "missing",
        paymentRuleId: "rule-1"
      })
    ]);

    expect(filtered.missing).toEqual([]);
    expect(filtered.overdue).toEqual([]);
    expect(filtered.unpaid).toEqual([]);
    expect(filtered.expected).toEqual(baseStatus.expected);
  });

  it("hides resolved duplicates only when the document set still matches", () => {
    const matchingResolution = resolution({
      categoryNodeId: "category-2",
      duplicateDocumentIds: ["doc-a", "doc-b"],
      fiscalPeriod: "2026-08",
      fiscalPeriodKind: "month",
      fingerprint: buildDuplicateIssueFingerprint(duplicate),
      issueType: "duplicate",
      paymentRuleId: null
    });

    expect(
      applyComplianceIssueResolutions(baseStatus, [matchingResolution]).duplicates
    ).toEqual([]);

    const changedDuplicateStatus: ComplianceStatus = {
      ...baseStatus,
      duplicates: [
        {
          ...duplicate,
          documents: [
            ...duplicate.documents,
            {
              id: "doc-c",
              amount: "109823.34",
              currency: "ARS",
              fileName: "08-extra.pdf",
              paymentDate: "2026-08-20"
            }
          ]
        }
      ]
    };

    expect(
      applyComplianceIssueResolutions(changedDuplicateStatus, [matchingResolution])
        .duplicates
    ).toHaveLength(1);
  });
});
