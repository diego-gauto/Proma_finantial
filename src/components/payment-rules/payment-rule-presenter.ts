import type { PaymentRuleRow } from "@/db/types";

export function buildSuggestedRuleName(
  categoryName: string,
  date: Date,
  existingNames: string[] = []
): string {
  const baseName = `Regla ${categoryName} ${formatRuleDate(date)}`;

  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  let duplicateIndex = 2;
  let candidate = `${baseName} ${duplicateIndex}`;

  while (existingNames.includes(candidate)) {
    duplicateIndex += 1;
    candidate = `${baseName} ${duplicateIndex}`;
  }

  return candidate;
}

export function sortRulesForHistory(rules: PaymentRuleRow[]): PaymentRuleRow[] {
  return [...rules].sort((left, right) => {
    const leftScore = getHistoryPriority(left);
    const rightScore = getHistoryPriority(right);

    if (leftScore !== rightScore) {
      return rightScore - leftScore;
    }

    return right.activeFrom.localeCompare(left.activeFrom);
  });
}

export function getCurrentRule(
  rules: PaymentRuleRow[]
): PaymentRuleRow | null {
  return sortRulesForHistory(rules).find((rule) => rule.active && !rule.activeTo) ?? null;
}

function getHistoryPriority(rule: PaymentRuleRow): number {
  if (rule.active && !rule.activeTo) {
    return 2;
  }

  if (rule.active) {
    return 1;
  }

  return 0;
}

function formatRuleDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${day}-${month}-${year}`;
}
