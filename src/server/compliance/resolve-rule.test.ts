import { describe, expect, it } from "vitest";

import { resolveApplicableRule } from "./resolve-rule";
import type { ComplianceCategory, ComplianceRule } from "./compliance-types";

const categories: ComplianceCategory[] = [
  { id: "root", parentId: null, name: "Root", sortOrder: 1 },
  { id: "child", parentId: "root", name: "Child", sortOrder: 1 },
  { id: "leaf", parentId: "child", name: "Leaf", sortOrder: 1 }
];

const baseRule: ComplianceRule = {
  id: "root-rule",
  categoryNodeId: "root",
  appliesToDescendants: true,
  name: "Root monthly",
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

describe("resolveApplicableRule", () => {
  it("uses the category own rule over an inherited ancestor rule", () => {
    const ownRule = {
      ...baseRule,
      id: "leaf-rule",
      categoryNodeId: "leaf",
      appliesToDescendants: false,
      paymentDay: 20
    };

    expect(
      resolveApplicableRule(categories, [baseRule, ownRule], "leaf", "2026-02")
        ?.id
    ).toBe("leaf-rule");
  });

  it("inherits the nearest ancestor rule that applies to descendants", () => {
    const childRule = {
      ...baseRule,
      id: "child-rule",
      categoryNodeId: "child",
      paymentDay: 15
    };

    expect(
      resolveApplicableRule(categories, [baseRule, childRule], "leaf", "2026-02")
        ?.id
    ).toBe("child-rule");
  });

  it("uses the rule that was active for the requested fiscal period", () => {
    const oldRule = {
      ...baseRule,
      id: "old",
      activeFrom: "2026-01-01",
      activeTo: "2026-02-28"
    };
    const newRule = {
      ...baseRule,
      id: "new",
      activeFrom: "2026-03-01",
      activeTo: null
    };

    expect(
      resolveApplicableRule(categories, [oldRule, newRule], "root", "2026-02")
        ?.id
    ).toBe("old");
    expect(
      resolveApplicableRule(categories, [oldRule, newRule], "root", "2026-03")
        ?.id
    ).toBe("new");
  });
});
