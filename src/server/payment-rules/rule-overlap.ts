import type { PaymentRuleRow } from "@/db/types";

import type { PaymentRuleInput } from "./payment-rule-form";

export function assertRuleDoesNotOverlap(
  input: PaymentRuleInput,
  existingRules: PaymentRuleRow[]
): void {
  const nextStart = toTime(input.activeFrom);
  const nextEnd = input.activeTo ? toTime(input.activeTo) : Infinity;

  if (nextEnd < nextStart) {
    throw new Error("La fecha de cierre debe ser posterior al inicio.");
  }

  const overlappingRule = existingRules.find((rule) => {
    if (!rule.active || rule.categoryNodeId !== input.categoryNodeId) {
      return false;
    }

    const existingStart = toTime(rule.activeFrom);
    const existingEnd = rule.activeTo ? toTime(rule.activeTo) : Infinity;

    return nextStart <= existingEnd && existingStart <= nextEnd;
  });

  if (overlappingRule) {
    throw new Error(
      `La regla se superpone con "${overlappingRule.name}" (${overlappingRule.activeFrom} a ${
        overlappingRule.activeTo ?? "abierta"
      }).`
    );
  }
}

export function assertOpenRuleHasAtLeastOneMonthOfValidity(
  input: PaymentRuleInput,
  existingRules: PaymentRuleRow[]
): void {
  const openRule = existingRules.find(
    (rule) =>
      rule.active &&
      !rule.activeTo &&
      rule.categoryNodeId === input.categoryNodeId &&
      rule.activeFrom <= input.activeFrom
  );

  if (!openRule) {
    return;
  }

  const minimumNextStart = getFirstDayOfNextMonth(openRule.activeFrom);

  if (input.activeFrom < minimumNextStart) {
    throw new Error(
      `La regla "${openRule.name}" debe tener al menos un mes de vigencia antes de crear una nueva.`
    );
  }
}

function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00.000Z`);
}

function getFirstDayOfNextMonth(date: string): string {
  const [year, month] = date.slice(0, 7).split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
}
