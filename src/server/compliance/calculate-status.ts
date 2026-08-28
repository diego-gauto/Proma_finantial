import { generateExpectedPeriods } from "./generate-expected-periods";
import { resolveApplicableRule } from "./resolve-rule";
import type {
  ComplianceCategory,
  ComplianceDocument,
  ComplianceRule,
  ComplianceStatus,
  ExpectedPeriod
} from "./compliance-types";
import { addDays, compareDateText } from "./period-utils";

interface CalculateComplianceStatusOptions {
  categories: ComplianceCategory[];
  rules: ComplianceRule[];
  documents: ComplianceDocument[];
  fromFiscalPeriod: string;
  toFiscalPeriod: string;
  today: string;
}

function documentKey(document: ComplianceDocument): string | null {
  if (
    !document.categoryNodeId ||
    !document.fiscalPeriod ||
    document.processingStatus !== "processed"
  ) {
    return null;
  }

  return [
    document.categoryNodeId,
    document.fiscalPeriod,
    document.fiscalPeriodKind
  ].join(":");
}

function expectedKey(period: ExpectedPeriod): string {
  return [
    period.categoryNodeId,
    period.fiscalPeriod,
    period.fiscalPeriodKind
  ].join(":");
}

export function calculateComplianceStatus({
  categories,
  rules,
  documents,
  fromFiscalPeriod,
  toFiscalPeriod,
  today
}: CalculateComplianceStatusOptions): ComplianceStatus {
  const expected: ExpectedPeriod[] = [];

  for (const category of categories) {
    for (let cursor = fromFiscalPeriod; cursor <= toFiscalPeriod; cursor = incrementFiscalPeriod(cursor)) {
      const rule = resolveApplicableRule(categories, rules, category.id, cursor);

      if (!rule) {
        continue;
      }

      expected.push(
        ...generateExpectedPeriods(rule, {
          categoryNodeId: category.id,
          fromFiscalPeriod: cursor,
          toFiscalPeriod: cursor
        })
      );
    }
  }

  const processedByKey = new Map<string, string[]>();

  for (const document of documents) {
    const key = documentKey(document);

    if (!key) {
      continue;
    }

    processedByKey.set(key, [...(processedByKey.get(key) ?? []), document.id]);
  }

  const missing = expected.filter((period) => {
    if (processedByKey.has(expectedKey(period))) {
      return false;
    }

    const graceLimit = addDays(period.dueDate, period.rule.graceDays);
    return compareDateText(graceLimit, today) < 0;
  });

  const upcoming = expected.filter((period) => {
    if (processedByKey.has(expectedKey(period))) {
      return false;
    }

    const reminderStart = addDays(period.dueDate, -period.rule.reminderDaysBefore);
    return (
      compareDateText(reminderStart, today) <= 0 &&
      compareDateText(today, period.dueDate) <= 0
    );
  });

  const duplicates = [...processedByKey.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([key, documentIds]) => {
      const [categoryNodeId, fiscalPeriod, fiscalPeriodKind] = key.split(":");

      return {
        categoryNodeId,
        fiscalPeriod,
        fiscalPeriodKind: fiscalPeriodKind as ExpectedPeriod["fiscalPeriodKind"],
        documentIds
      };
    });

  return {
    expected,
    missing,
    overdue: missing,
    upcoming,
    duplicates
  };
}

function incrementFiscalPeriod(fiscalPeriod: string): string {
  const [yearText, monthText] = fiscalPeriod.split("-");
  const year = Number(yearText);

  if (!monthText) {
    return String(year + 1);
  }

  const month = Number(monthText);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}
