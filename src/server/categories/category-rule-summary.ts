import type { CategoryNodeRow, PaymentRuleRow } from "@/db/types";
import { resolveApplicableRule } from "@/server/compliance/resolve-rule";

export type CategoryRuleSummaryType = "own" | "inherited" | "none";

export interface CategoryRuleSummary {
  inheritedFromCategoryId: string | null;
  label: string;
  ruleName: string | null;
  type: CategoryRuleSummaryType;
}

export function getCategoryRuleSummaries(
  categories: CategoryNodeRow[],
  rules: PaymentRuleRow[],
  fiscalPeriod: string
): Map<string, CategoryRuleSummary> {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category])
  );

  return new Map<string, CategoryRuleSummary>(
    categories.map((category) => {
      const rule = resolveApplicableRule(
        categories,
        rules,
        category.id,
        fiscalPeriod
      );

      if (!rule) {
        return [
          category.id,
          {
            inheritedFromCategoryId: null,
            label: "Sin regla vigente",
            ruleName: null,
            type: "none"
          }
        ];
      }

      if (rule.categoryNodeId === category.id) {
        return [
          category.id,
          {
            inheritedFromCategoryId: null,
            label: `Regla propia: ${rule.name}`,
            ruleName: rule.name,
            type: "own"
          }
        ];
      }

      return [
        category.id,
        {
          inheritedFromCategoryId: rule.categoryNodeId,
          label: `Hereda de ${
            categoriesById.get(rule.categoryNodeId)?.name ?? "ancestro"
          }: ${rule.name}`,
          ruleName: rule.name,
          type: "inherited"
        }
      ];
    })
  );
}
