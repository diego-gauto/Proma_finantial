import type { CategoryNodeRow } from "@/db/types";
import { getCategoryBreadcrumbs } from "@/server/categories/category-tree";
import type {
  ComplianceStatus,
  ExpectedPeriod
} from "@/server/compliance/compliance-types";

export interface ComplianceIssueTableRow {
  id: string;
  categoryPath: string[];
  categoryTone: "a" | "b";
  fiscalPeriod: string;
  paymentMonth: string;
  expectedPaymentDay: string;
  href: string;
  documentCount: number | null;
  statusMetric?: string;
  duplicateDocuments: Array<{
    id: string;
    amount: string;
    fileName: string;
    paymentDate: string;
  }>;
}

export function buildMissingIssueRows(
  missing: ExpectedPeriod[],
  categories: CategoryNodeRow[]
): ComplianceIssueTableRow[] {
  return toSortedIssueRows(
    missing.map((period) => ({
      id: `missing-${period.categoryNodeId}-${period.fiscalPeriod}-${period.fiscalPeriodKind}`,
      categoryPath: getIssueCategoryPath(categories, period.categoryNodeId),
      categorySortPath: getIssueCategorySortPath(categories, period.categoryNodeId),
      expectedPaymentDay: getExpectedPaymentDay(period.dueDate),
      fiscalPeriod: period.fiscalPeriod,
      href: buildDashboardFilterHref(period.categoryNodeId, period.fiscalPeriod),
      paymentMonth: getPaymentMonth(period.dueDate),
      documentCount: null,
      duplicateDocuments: []
    }))
  );
}

export function buildDuplicateIssueRows(
  duplicates: ComplianceStatus["duplicates"],
  expected: ExpectedPeriod[],
  categories: CategoryNodeRow[]
): ComplianceIssueTableRow[] {
  const expectedByPeriod = new Map(
    expected.map((period) => [getExpectedPeriodKey(period), period])
  );

  return toSortedIssueRows(duplicates.map((duplicate) => {
    const expectedPeriod = expectedByPeriod.get(getExpectedPeriodKey(duplicate));

    return {
      id: `duplicate-${duplicate.categoryNodeId}-${duplicate.fiscalPeriod}-${duplicate.fiscalPeriodKind}`,
      categoryPath: getIssueCategoryPath(categories, duplicate.categoryNodeId),
      categorySortPath: getIssueCategorySortPath(
        categories,
        duplicate.categoryNodeId
      ),
      expectedPaymentDay: expectedPeriod
        ? getExpectedPaymentDay(expectedPeriod.dueDate)
        : "Sin regla",
      fiscalPeriod: duplicate.fiscalPeriod,
      href: buildDashboardFilterHref(
        duplicate.categoryNodeId,
        duplicate.fiscalPeriod
      ),
      paymentMonth: expectedPeriod
        ? getPaymentMonth(expectedPeriod.dueDate)
        : "Sin regla",
      documentCount: duplicate.documents.length,
      duplicateDocuments: duplicate.documents
        .map((document) => ({
          id: document.id,
          amount: formatAmount(document.amount, document.currency),
          fileName: document.fileName || "Archivo sin nombre",
          paymentDate: document.paymentDate || "Sin fecha"
        }))
        .sort((left, right) => left.paymentDate.localeCompare(right.paymentDate))
    };
  }));
}

export function buildOverdueIssueRows(
  overdue: ExpectedPeriod[],
  categories: CategoryNodeRow[],
  today: string
): ComplianceIssueTableRow[] {
  return buildStatusIssueRows(overdue, categories, today, "overdue");
}

export function buildUpcomingIssueRows(
  upcoming: ExpectedPeriod[],
  categories: CategoryNodeRow[],
  today: string
): ComplianceIssueTableRow[] {
  return buildStatusIssueRows(upcoming, categories, today, "upcoming");
}

function buildStatusIssueRows(
  periods: ExpectedPeriod[],
  categories: CategoryNodeRow[],
  today: string,
  status: "overdue" | "upcoming"
): ComplianceIssueTableRow[] {
  return toSortedIssueRows(
    periods.map((period) => ({
      id: `${status}-${period.categoryNodeId}-${period.fiscalPeriod}-${period.fiscalPeriodKind}`,
      categoryPath: getIssueCategoryPath(categories, period.categoryNodeId),
      categorySortPath: getIssueCategorySortPath(categories, period.categoryNodeId),
      expectedPaymentDay: getExpectedPaymentDay(period.dueDate),
      fiscalPeriod: period.fiscalPeriod,
      href: buildDashboardFilterHref(period.categoryNodeId, period.fiscalPeriod),
      paymentMonth: getPaymentMonth(period.dueDate),
      documentCount: null,
      duplicateDocuments: [],
      statusMetric:
        status === "overdue"
          ? `${getDaysBetween(period.dueDate, today)} dias vencidos`
          : `${getDaysBetween(today, period.dueDate)} dias faltantes`
    }))
  );
}

function getIssueCategoryPath(
  categories: CategoryNodeRow[],
  categoryNodeId: string
): string[] {
  const breadcrumbs = getCategoryBreadcrumbs(categories, categoryNodeId);

  return breadcrumbs.length ? breadcrumbs : ["Categoria sin ubicar"];
}

function getIssueCategorySortPath(
  categories: CategoryNodeRow[],
  categoryNodeId: string
): number[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const sortPath: number[] = [];
  let current = byId.get(categoryNodeId);

  while (current) {
    sortPath.unshift(current.sortOrder);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return sortPath.length ? sortPath : [Number.MAX_SAFE_INTEGER];
}

interface ComplianceIssueTableRowDraft
  extends Omit<ComplianceIssueTableRow, "categoryTone"> {
  categorySortPath: number[];
}

function toSortedIssueRows(rows: ComplianceIssueTableRowDraft[]): ComplianceIssueTableRow[] {
  let currentCategoryKey = "";
  let currentTone: ComplianceIssueTableRow["categoryTone"] = "a";

  return rows.sort(compareIssueRows).map((row) => {
    const categoryKey = row.categoryPath.join("\u001f");

    if (categoryKey !== currentCategoryKey) {
      currentTone = currentTone === "a" ? "b" : "a";
      currentCategoryKey = categoryKey;
    }

    return toIssueTableRow(row, currentTone);
  });
}

function toIssueTableRow({
  categoryPath,
  duplicateDocuments,
  documentCount,
  expectedPaymentDay,
  fiscalPeriod,
  href,
  id,
  paymentMonth,
  statusMetric
}: ComplianceIssueTableRowDraft, categoryTone: ComplianceIssueTableRow["categoryTone"]): ComplianceIssueTableRow {
  return {
    categoryPath,
    categoryTone,
    duplicateDocuments,
    documentCount,
    expectedPaymentDay,
    fiscalPeriod,
    href,
    id,
    paymentMonth,
    statusMetric
  };
}

function compareIssueRows(
  left: ComplianceIssueTableRowDraft,
  right: ComplianceIssueTableRowDraft
): number {
  const maxDepth = Math.max(left.categoryPath.length, right.categoryPath.length);

  for (let index = 0; index < maxDepth; index += 1) {
    const sortDifference =
      (left.categorySortPath[index] ?? Number.MAX_SAFE_INTEGER) -
      (right.categorySortPath[index] ?? Number.MAX_SAFE_INTEGER);

    if (sortDifference !== 0) {
      return sortDifference;
    }

    const nameDifference = (left.categoryPath[index] ?? "").localeCompare(
      right.categoryPath[index] ?? "",
      "es"
    );

    if (nameDifference !== 0) {
      return nameDifference;
    }
  }

  return left.fiscalPeriod.localeCompare(right.fiscalPeriod);
}

function buildDashboardFilterHref(
  categoryNodeId: string,
  fiscalPeriod: string
): string {
  return `/?categoryId=${categoryNodeId}&fiscalPeriod=${fiscalPeriod}`;
}

function getPaymentMonth(dueDate: string): string {
  return dueDate.slice(0, 7);
}

function getExpectedPaymentDay(dueDate: string): string {
  return dueDate.slice(8, 10);
}

function formatAmount(amount: string | null, currency: string | null): string {
  if (!amount) {
    return "Sin monto";
  }

  return currency ? `${currency} ${amount}` : amount;
}

function getDaysBetween(fromDate: string, toDate: string): number {
  const from = Date.parse(`${fromDate}T00:00:00.000Z`);
  const to = Date.parse(`${toDate}T00:00:00.000Z`);

  return Math.max(0, Math.floor((to - from) / 86_400_000));
}

function getExpectedPeriodKey(
  period: Pick<
    ExpectedPeriod,
    "categoryNodeId" | "fiscalPeriod" | "fiscalPeriodKind"
  >
): string {
  return `${period.categoryNodeId}:${period.fiscalPeriod}:${period.fiscalPeriodKind}`;
}
