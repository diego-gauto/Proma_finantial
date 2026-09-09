import { describe, expect, it } from "vitest";

import type { PaymentRuleRow } from "@/db/types";

import {
  buildSuggestedRuleName,
  getCurrentRule,
  sortRulesForHistory
} from "./payment-rule-presenter";

const baseRule: PaymentRuleRow = {
  active: false,
  activeFrom: "2026-01-01",
  activeTo: "2026-01-31",
  anchorPeriodMonth: 1,
  appliesToDescendants: false,
  cadence: "monthly",
  categoryNodeId: "9",
  fiscalPeriodKind: "month",
  graceDays: 5,
  id: "rule-base",
  name: "Regla Arca 01-01-26",
  notes: null,
  paymentDay: 10,
  paymentMonth: null,
  paymentMonthOffset: 1,
  paymentYearOffset: 0,
  reminderDaysBefore: 7,
  customPeriodMonths: null
};

describe("payment-rule-presenter", () => {
  it("builds a default rule name from category and current date", () => {
    expect(buildSuggestedRuleName("Arca", new Date("2026-09-02T12:00:00Z"))).toBe(
      "Regla Arca 02-09-26"
    );
  });

  it("avoids repeating a suggested name when one already exists", () => {
    expect(
      buildSuggestedRuleName("Arca", new Date("2026-09-02T12:00:00Z"), [
        "Regla Arca 02-09-26",
        "Regla Arca 02-09-26 2"
      ])
    ).toBe("Regla Arca 02-09-26 3");
  });

  it("keeps the current open rule first in history", () => {
    const rules = sortRulesForHistory([
      {
        ...baseRule,
        id: "historic",
        activeFrom: "2026-08-01",
        activeTo: "2026-08-31",
        name: "Regla historica"
      },
      {
        ...baseRule,
        active: true,
        activeFrom: "2026-07-01",
        activeTo: null,
        id: "current",
        name: "Regla actual"
      },
      {
        ...baseRule,
        active: true,
        activeFrom: "2026-09-01",
        activeTo: "2026-09-30",
        id: "scheduled",
        name: "Regla programada"
      }
    ]);

    expect(rules.map((rule) => rule.id)).toEqual([
      "current",
      "scheduled",
      "historic"
    ]);
  });

  it("returns the editable current rule when one is open", () => {
    expect(
      getCurrentRule([
        baseRule,
        {
          ...baseRule,
          active: true,
          activeFrom: "2026-09-01",
          activeTo: null,
          id: "current",
          name: "Regla actual"
        }
      ])?.id
    ).toBe("current");
  });
});
