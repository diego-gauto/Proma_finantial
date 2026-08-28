import type { ExpectedPeriod, ComplianceRule } from "./compliance-types";
import {
  dateToMonthIndex,
  fiscalPeriodToMonthIndex,
  getCadenceMonths,
  getDueDate,
  monthIndexToFiscalPeriod
} from "./period-utils";

interface GenerateExpectedPeriodsOptions {
  categoryNodeId: string;
  fromFiscalPeriod: string;
  toFiscalPeriod: string;
}

export function generateExpectedPeriods(
  rule: ComplianceRule,
  options: GenerateExpectedPeriodsOptions
): ExpectedPeriod[] {
  const cadenceMonths = getCadenceMonths(rule.cadence, rule.customPeriodMonths);

  if (!rule.active || !cadenceMonths) {
    return [];
  }

  const from = Math.max(
    fiscalPeriodToMonthIndex(options.fromFiscalPeriod, rule.fiscalPeriodKind),
    dateToMonthIndex(rule.activeFrom)
  );
  const to = Math.min(
    fiscalPeriodToMonthIndex(options.toFiscalPeriod, rule.fiscalPeriodKind),
    rule.activeTo ? dateToMonthIndex(rule.activeTo) : Infinity
  );
  const anchorMonth = rule.anchorPeriodMonth ?? 1;
  const periods: ExpectedPeriod[] = [];

  for (let monthIndex = from; monthIndex <= to; monthIndex += 1) {
    const month = (monthIndex % 12) + 1;
    const matchesCadence =
      rule.fiscalPeriodKind === "year" ||
      ((month - anchorMonth) % cadenceMonths === 0);

    if (!matchesCadence) {
      continue;
    }

    const fiscalPeriod = monthIndexToFiscalPeriod(
      monthIndex,
      rule.fiscalPeriodKind
    );

    periods.push({
      categoryNodeId: options.categoryNodeId,
      fiscalPeriod,
      fiscalPeriodKind: rule.fiscalPeriodKind,
      dueDate: getDueDate(fiscalPeriod, rule.fiscalPeriodKind, rule),
      rule
    });

    if (rule.fiscalPeriodKind === "year") {
      monthIndex += 11;
    }
  }

  return periods;
}
