import type { PaymentRuleRow } from "@/db/types";
import { describe, expect, it } from "vitest";

import {
  assertOpenRuleHasAtLeastOneMonthOfValidity,
  assertRuleDoesNotOverlap
} from "./rule-overlap";
import type { PaymentRuleInput } from "./payment-rule-form";

const existingRule = {
  active: true,
  activeFrom: "2026-01-01",
  activeTo: "2026-03-31",
  anchorPeriodMonth: 1,
  appliesToDescendants: false,
  cadence: "monthly",
  categoryNodeId: "cat-1",
  customPeriodMonths: null,
  fiscalPeriodKind: "month",
  graceDays: 5,
  id: "rule-1",
  name: "Regla vigente",
  notes: null,
  paymentDay: 10,
  paymentMonth: null,
  paymentMonthOffset: 1,
  paymentYearOffset: 0,
  reminderDaysBefore: 7
} satisfies PaymentRuleRow;

const inputRule = {
  activeFrom: "2026-04-01",
  activeTo: null,
  appliesToDescendants: false,
  categoryNodeId: "cat-1",
  customPeriodMonths: null,
  fiscalPeriodKind: "month",
  graceDays: 5,
  intervalMonths: 1,
  name: "Nueva regla",
  notes: null,
  paymentDay: 10,
  paymentMonth: null,
  paymentMonthOffset: 1,
  paymentYearOffset: 0,
  reminderDaysBefore: 7
} satisfies PaymentRuleInput;

describe("assertRuleDoesNotOverlap", () => {
  it("allows adjacent rule periods for the same category", () => {
    expect(() =>
      assertRuleDoesNotOverlap(inputRule, [existingRule])
    ).not.toThrow();
  });

  it("rejects overlapping rule periods for the same category", () => {
    expect(() =>
      assertRuleDoesNotOverlap(
        { ...inputRule, activeFrom: "2026-03-01" },
        [existingRule]
      )
    ).toThrow("se superpone");
  });

  it("ignores rules from other categories", () => {
    expect(() =>
      assertRuleDoesNotOverlap(
        { ...inputRule, activeFrom: "2026-03-01" },
        [{ ...existingRule, categoryNodeId: "cat-2" }]
      )
    ).not.toThrow();
  });

  it("rejects an end date before the start date", () => {
    expect(() =>
      assertRuleDoesNotOverlap(
        { ...inputRule, activeFrom: "2026-04-01", activeTo: "2026-03-31" },
        []
      )
    ).toThrow("posterior");
  });
});

describe("assertOpenRuleHasAtLeastOneMonthOfValidity", () => {
  it("allows a new rule in the month after the current rule starts", () => {
    expect(() =>
      assertOpenRuleHasAtLeastOneMonthOfValidity(
        { ...inputRule, activeFrom: "2026-05-01" },
        [{ ...existingRule, activeFrom: "2026-04-01", activeTo: null }]
      )
    ).not.toThrow();
  });

  it("rejects replacing the current rule in its starting month", () => {
    expect(() =>
      assertOpenRuleHasAtLeastOneMonthOfValidity(
        { ...inputRule, activeFrom: "2026-04-01" },
        [{ ...existingRule, activeFrom: "2026-04-01", activeTo: null }]
      )
    ).toThrow("al menos un mes");
  });
});
