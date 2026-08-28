import { describe, expect, it } from "vitest";

import { calculateComplianceStatus } from "./calculate-status";
import type {
  ComplianceCategory,
  ComplianceDocument,
  ComplianceRule
} from "./compliance-types";

const categories: ComplianceCategory[] = [
  { id: "root", parentId: null, name: "Root", sortOrder: 1 },
  { id: "leaf", parentId: "root", name: "Leaf", sortOrder: 1 }
];

const rule: ComplianceRule = {
  id: "rule",
  categoryNodeId: "leaf",
  appliesToDescendants: false,
  name: "Monthly",
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

describe("calculateComplianceStatus", () => {
  it("does not mark a monthly period missing when a processed document exists", () => {
    const documents: ComplianceDocument[] = [
      {
        id: "doc-1",
        categoryNodeId: "leaf",
        fiscalPeriod: "2026-01",
        fiscalPeriodKind: "month",
        processingStatus: "processed"
      }
    ];

    const status = calculateComplianceStatus({
      categories,
      rules: [rule],
      documents,
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-03-01"
    });

    expect(status.missing).toEqual([]);
  });

  it("marks a monthly period missing after its grace period", () => {
    const status = calculateComplianceStatus({
      categories,
      rules: [rule],
      documents: [],
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-02-20"
    });

    expect(status.missing.map((period) => period.fiscalPeriod)).toEqual([
      "2026-01"
    ]);
    expect(status.overdue.map((period) => period.fiscalPeriod)).toEqual([
      "2026-01"
    ]);
  });

  it("does not count review_required or error documents as paid", () => {
    const documents: ComplianceDocument[] = [
      {
        id: "doc-review",
        categoryNodeId: "leaf",
        fiscalPeriod: "2026-01",
        fiscalPeriodKind: "month",
        processingStatus: "review_required"
      },
      {
        id: "doc-error",
        categoryNodeId: "leaf",
        fiscalPeriod: "2026-01",
        fiscalPeriodKind: "month",
        processingStatus: "error"
      }
    ];

    const status = calculateComplianceStatus({
      categories,
      rules: [rule],
      documents,
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-02-20"
    });

    expect(status.missing).toHaveLength(1);
  });

  it("finds duplicate processed documents for the same category and fiscal period", () => {
    const documents: ComplianceDocument[] = [
      {
        id: "doc-1",
        categoryNodeId: "leaf",
        fiscalPeriod: "2026-01",
        fiscalPeriodKind: "month",
        processingStatus: "processed"
      },
      {
        id: "doc-2",
        categoryNodeId: "leaf",
        fiscalPeriod: "2026-01",
        fiscalPeriodKind: "month",
        processingStatus: "processed"
      }
    ];

    const status = calculateComplianceStatus({
      categories,
      rules: [rule],
      documents,
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-02-20"
    });

    expect(status.duplicates).toEqual([
      {
        categoryNodeId: "leaf",
        fiscalPeriod: "2026-01",
        fiscalPeriodKind: "month",
        documentIds: ["doc-1", "doc-2"]
      }
    ]);
  });

  it("shows upcoming unpaid periods inside the reminder window", () => {
    const status = calculateComplianceStatus({
      categories,
      rules: [rule],
      documents: [],
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-02-04"
    });

    expect(status.upcoming.map((period) => period.fiscalPeriod)).toEqual([
      "2026-01"
    ]);
    expect(status.missing).toEqual([]);
  });

  it("applies inherited ancestor rules to descendants", () => {
    const inheritedRule = {
      ...rule,
      id: "root-rule",
      categoryNodeId: "root",
      appliesToDescendants: true
    };

    const status = calculateComplianceStatus({
      categories,
      rules: [inheritedRule],
      documents: [],
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-02-20"
    });

    expect(
      status.missing.some((period) => period.categoryNodeId === "leaf")
    ).toBe(true);
  });

  it("uses an own rule instead of the inherited ancestor rule", () => {
    const inheritedRule = {
      ...rule,
      id: "root-rule",
      categoryNodeId: "root",
      appliesToDescendants: true,
      paymentDay: 10
    };
    const ownRule = {
      ...rule,
      id: "leaf-rule",
      categoryNodeId: "leaf",
      appliesToDescendants: false,
      paymentDay: 20
    };

    const status = calculateComplianceStatus({
      categories,
      rules: [inheritedRule, ownRule],
      documents: [],
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-03-01"
    });
    const leafMissing = status.missing.find(
      (period) => period.categoryNodeId === "leaf"
    );

    expect(leafMissing?.rule.id).toBe("leaf-rule");
    expect(leafMissing?.dueDate).toBe("2026-02-20");
  });

  it("uses historical rules for past fiscal periods", () => {
    const oldRule = {
      ...rule,
      id: "old-rule",
      activeFrom: "2026-01-01",
      activeTo: "2026-01-31",
      paymentDay: 10
    };
    const newRule = {
      ...rule,
      id: "new-rule",
      activeFrom: "2026-02-01",
      activeTo: null,
      paymentDay: 25
    };

    const status = calculateComplianceStatus({
      categories,
      rules: [oldRule, newRule],
      documents: [],
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-02",
      today: "2026-04-01"
    });

    expect(
      status.missing.map((period) => ({
        fiscalPeriod: period.fiscalPeriod,
        ruleId: period.rule.id,
        dueDate: period.dueDate
      }))
    ).toEqual([
      {
        fiscalPeriod: "2026-01",
        ruleId: "old-rule",
        dueDate: "2026-02-10"
      },
      {
        fiscalPeriod: "2026-02",
        ruleId: "new-rule",
        dueDate: "2026-03-25"
      }
    ]);
  });
});
