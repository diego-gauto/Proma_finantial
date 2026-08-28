import { describe, expect, it } from "vitest";

import { generateExpectedPeriods } from "./generate-expected-periods";
import type { ComplianceRule } from "./compliance-types";

const monthlyRule: ComplianceRule = {
  id: "rule-1",
  categoryNodeId: "cat-1",
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

describe("generateExpectedPeriods", () => {
  it("generates monthly expected fiscal periods within the active range", () => {
    const periods = generateExpectedPeriods(monthlyRule, {
      categoryNodeId: "cat-1",
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-03"
    });

    expect(periods.map((period) => period.fiscalPeriod)).toEqual([
      "2026-01",
      "2026-02",
      "2026-03"
    ]);
    expect(periods[0]?.dueDate).toBe("2026-02-10");
  });

  it("uses annual fiscal period formatting for annual rules", () => {
    const periods = generateExpectedPeriods(
      {
        ...monthlyRule,
        cadence: "annual",
        fiscalPeriodKind: "year",
        paymentMonth: 3,
        paymentDay: 31,
        activeFrom: "2025-01-01"
      },
      {
        categoryNodeId: "cat-1",
        fromFiscalPeriod: "2025",
        toFiscalPeriod: "2026"
      }
    );

    expect(periods.map((period) => period.fiscalPeriod)).toEqual([
      "2025",
      "2026"
    ]);
    expect(periods[0]?.dueDate).toBe("2025-03-31");
  });
});
