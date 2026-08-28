import type {
  ComplianceCategory,
  ComplianceRule
} from "./compliance-types";
import { fiscalPeriodToMonthIndex } from "./period-utils";

function getAncestorChain(
  categories: ComplianceCategory[],
  categoryId: string
): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const chain: string[] = [];
  let current = byId.get(categoryId);

  while (current) {
    chain.unshift(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return chain;
}

function isRuleActiveForPeriod(
  rule: ComplianceRule,
  fiscalPeriod: string
): boolean {
  if (!rule.active || rule.cadence === "no_pattern") {
    return false;
  }

  const periodMonth = fiscalPeriodToMonthIndex(fiscalPeriod, rule.fiscalPeriodKind);
  const activeFrom = dateToComparableMonth(rule.activeFrom);
  const activeTo = rule.activeTo ? dateToComparableMonth(rule.activeTo) : Infinity;

  return periodMonth >= activeFrom && periodMonth <= activeTo;
}

function dateToComparableMonth(dateText: string): number {
  const [yearText, monthText] = dateText.split("-");
  return Number(yearText) * 12 + Number(monthText) - 1;
}

export function resolveApplicableRule(
  categories: ComplianceCategory[],
  rules: ComplianceRule[],
  categoryId: string,
  fiscalPeriod: string
): ComplianceRule | null {
  const chain = getAncestorChain(categories, categoryId);

  for (const candidateCategoryId of [...chain].reverse()) {
    const categoryRules = rules
      .filter((rule) => {
        if (rule.categoryNodeId !== candidateCategoryId) {
          return false;
        }

        if (candidateCategoryId !== categoryId && !rule.appliesToDescendants) {
          return false;
        }

        return isRuleActiveForPeriod(rule, fiscalPeriod);
      })
      .sort((a, b) => b.activeFrom.localeCompare(a.activeFrom));

    if (categoryRules[0]) {
      return categoryRules[0];
    }
  }

  return null;
}
