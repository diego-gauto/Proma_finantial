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
  targetCategoryIds?: string[];
  today: string;
}

function documentKeys(document: ComplianceDocument): string[] {
  if (
    !document.categoryNodeId ||
    !document.fiscalPeriod ||
    document.processingStatus !== "processed"
  ) {
    return [];
  }

  return getCoveredFiscalPeriods(document).map((fiscalPeriod) =>
    [
      document.categoryNodeId,
      fiscalPeriod,
      document.fiscalPeriodKind
    ].join(":")
  );
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
  targetCategoryIds,
  today
}: CalculateComplianceStatusOptions): ComplianceStatus {
  const expected: ExpectedPeriod[] = [];
  const expectedByKey = new Map<string, ExpectedPeriod>();
  const targetCategoryIdSet = targetCategoryIds
    ? new Set(targetCategoryIds)
    : null;
  const categoriesToGenerate = targetCategoryIdSet
    ? categories.filter((category) => targetCategoryIdSet.has(category.id))
    : categories;

  for (const category of categoriesToGenerate) {
    for (
      let cursor = fromFiscalPeriod;
      cursor <= toFiscalPeriod;
      cursor = incrementFiscalPeriod(cursor)
    ) {
      const rule = resolveApplicableRule(
        categories,
        rules,
        category.id,
        cursor
      );

      if (!rule) {
        continue;
      }

      const generatedPeriods = generateExpectedPeriods(rule, {
        categoryNodeId: category.id,
        fromFiscalPeriod: cursor,
        toFiscalPeriod: cursor
      });

      for (const period of generatedPeriods) {
        const key = expectedKey(period);

        if (!expectedByKey.has(key)) {
          expectedByKey.set(key, period);
          expected.push(period);
        }
      }
    }
  }

  const processedByKey = new Map<
    string,
    ComplianceStatus["duplicates"][number]["documents"]
  >();

  for (const document of documents) {
    const keys = documentKeys(document);

    for (const key of keys) {
      processedByKey.set(key, [
        ...(processedByKey.get(key) ?? []),
        {
          id: document.id,
          amount: document.amount ?? null,
          currency: document.currency ?? null,
          fileName: document.fileName ?? null,
          paymentDate: document.paymentDate ?? null
        }
      ]);
    }
  }

  const unpaid = expected.filter(
    (period) => !processedByKey.has(expectedKey(period))
  );

  const missing = unpaid.filter((period) => {
    const graceLimit = addDays(period.dueDate, period.rule.graceDays);
    return compareDateText(graceLimit, today) < 0;
  });

  const upcoming = unpaid.filter((period) => {
    const reminderStart = addDays(period.dueDate, -period.rule.reminderDaysBefore);
    return (
      compareDateText(reminderStart, today) <= 0 &&
      compareDateText(today, period.dueDate) <= 0
    );
  });

  const duplicates = [...processedByKey.entries()]
    .filter(([, duplicateDocuments]) => duplicateDocuments.length > 1)
    .map(([key, duplicateDocuments]) => {
      const [categoryNodeId, fiscalPeriod, fiscalPeriodKind] = key.split(":");

      return {
        categoryNodeId,
        fiscalPeriod,
        fiscalPeriodKind: fiscalPeriodKind as ExpectedPeriod["fiscalPeriodKind"],
        documents: duplicateDocuments
      };
    });

  return {
    expected,
    missing,
    overdue: missing,
    unpaid,
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

function getCoveredFiscalPeriods(document: ComplianceDocument): string[] {
  if (
    document.fiscalPeriodKind !== "month" ||
    !document.fiscalPeriod?.includes("-")
  ) {
    return document.fiscalPeriod ? [document.fiscalPeriod] : [];
  }

  const year = document.fiscalPeriod.slice(0, 4);
  const months = document.coveredFiscalMonths?.length
    ? document.coveredFiscalMonths
    : [Number(document.fiscalPeriod.slice(5, 7))];

  return [...new Set(months)]
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
    .sort((a, b) => a - b)
    .map((month) => `${year}-${String(month).padStart(2, "0")}`);
}
