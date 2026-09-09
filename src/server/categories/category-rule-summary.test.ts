import { describe, expect, it } from "vitest";

import type { CategoryNodeRow, PaymentRuleRow } from "@/db/types";

import { getCategoryRuleSummaries } from "./category-rule-summary";

const categoryBase = {
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  sortOrder: 1,
  updatedAt: "2026-01-01T00:00:00.000Z"
} satisfies Omit<CategoryNodeRow, "id" | "name" | "parentId">;

const ruleBase = {
  active: true,
  activeFrom: "2026-01-01",
  activeTo: null,
  anchorPeriodMonth: 1,
  cadence: "monthly",
  customPeriodMonths: null,
  fiscalPeriodKind: "month",
  graceDays: 5,
  paymentDay: 10,
  paymentMonth: null,
  paymentMonthOffset: 0,
  paymentYearOffset: 0,
  reminderDaysBefore: 3
} satisfies Omit<
  PaymentRuleRow,
  "appliesToDescendants" | "categoryNodeId" | "id" | "name" | "notes"
>;

describe("getCategoryRuleSummaries", () => {
  it("marks own and inherited active rules for category nodes", () => {
    const categories: CategoryNodeRow[] = [
      { ...categoryBase, id: "root", name: "Root", parentId: null },
      { ...categoryBase, id: "child", name: "Child", parentId: "root" },
      { ...categoryBase, id: "leaf", name: "Leaf", parentId: "child" }
    ];
    const rules: PaymentRuleRow[] = [
      {
        ...ruleBase,
        appliesToDescendants: true,
        categoryNodeId: "root",
        id: "root-rule",
        name: "Regla raiz",
        notes: null
      },
      {
        ...ruleBase,
        appliesToDescendants: false,
        categoryNodeId: "leaf",
        id: "leaf-rule",
        name: "Regla propia",
        notes: null
      }
    ];

    const summaries = getCategoryRuleSummaries(
      categories,
      rules,
      "2026-08"
    );

    expect(summaries.get("child")).toEqual({
      inheritedFromCategoryId: "root",
      label: "Hereda de Root: Regla raiz",
      ruleName: "Regla raiz",
      type: "inherited"
    });
    expect(summaries.get("leaf")).toEqual({
      inheritedFromCategoryId: null,
      label: "Regla propia: Regla propia",
      ruleName: "Regla propia",
      type: "own"
    });
  });

  it("marks nodes without an applicable active rule", () => {
    const categories: CategoryNodeRow[] = [
      { ...categoryBase, id: "root", name: "Root", parentId: null }
    ];

    expect(
      getCategoryRuleSummaries(categories, [], "2026-08").get("root")
    ).toEqual({
      inheritedFromCategoryId: null,
      label: "Sin regla vigente",
      ruleName: null,
      type: "none"
    });
  });
});
