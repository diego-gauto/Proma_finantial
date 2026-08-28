import { describe, expect, it } from "vitest";

import { getDashboardAlerts } from "./get-dashboard-alerts";
import type { ComplianceStatus } from "@/server/compliance/compliance-types";
import type { DocumentRow } from "@/db/types";

const baseDocument: DocumentRow = {
  id: "doc-1",
  driveFileId: null,
  driveUrl: null,
  fileName: null,
  drivePath: null,
  categoryNodeId: "cat-1",
  paymentDate: "2026-02-10",
  paymentTime: null,
  fiscalPeriod: "2026-01",
  fiscalPeriodKind: "month",
  amount: "1000",
  currency: "ARS",
  reason: "Servicio",
  reference: null,
  issuer: null,
  payee: null,
  userNote: null,
  rawText: null,
  extractedData: null,
  processingStatus: "processed",
  processingError: null,
  createdAt: "2026-02-10T00:00:00.000Z",
  updatedAt: "2026-02-10T00:00:00.000Z"
};

const compliance: ComplianceStatus = {
  expected: [],
  missing: [
    {
      categoryNodeId: "cat-1",
      fiscalPeriod: "2026-01",
      fiscalPeriodKind: "month",
      dueDate: "2026-02-10",
      rule: {
        id: "rule-1",
        categoryNodeId: "cat-1",
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
      }
    }
  ],
  overdue: [],
  upcoming: [],
  duplicates: [
    {
      categoryNodeId: "cat-1",
      fiscalPeriod: "2026-01",
      fiscalPeriodKind: "month",
      documentIds: ["doc-1", "doc-2"]
    }
  ]
};

describe("getDashboardAlerts", () => {
  it("counts review, error, missing, and duplicate items", () => {
    expect(
      getDashboardAlerts({
        documents: [
          baseDocument,
          { ...baseDocument, id: "doc-2", processingStatus: "review_required" },
          { ...baseDocument, id: "doc-3", processingStatus: "error" }
        ],
        compliance
      })
    ).toEqual({
      reviewRequiredCount: 1,
      errorCount: 1,
      missingCount: 1,
      duplicateCount: 1
    });
  });
});
