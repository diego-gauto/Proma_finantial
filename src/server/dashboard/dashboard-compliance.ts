import { listCategoryNodes } from "@/db/categories.repository";
import { listDocuments } from "@/db/documents.repository";
import { listPaymentRules } from "@/db/payment-rules.repository";
import { getDescendantCategoryIds, getLeafCategoryIds } from "@/server/categories/category-tree";
import { calculateComplianceStatus } from "@/server/compliance/calculate-status";
import type { ComplianceStatus } from "@/server/compliance/compliance-types";
import { getOverduePayments } from "@/server/compliance/get-overdue-payments";
import { getUpcomingPayments } from "@/server/compliance/get-upcoming-payments";

import {
  buildAvailableFiscalPeriods,
  getAutoSelectedCategoryId,
  type DashboardFilters
} from "./dashboard-filters";

export interface FilteredComplianceData {
  categories: Awaited<ReturnType<typeof listCategoryNodes>>;
  compliance: ComplianceStatus;
  documents: Awaited<ReturnType<typeof listDocuments>>;
  filters: DashboardFilters;
  fiscalPeriods: string[];
}

export interface CurrentMonthPaymentStatusData {
  categories: Awaited<ReturnType<typeof listCategoryNodes>>;
  overdue: ComplianceStatus["expected"];
  today: string;
  upcoming: ComplianceStatus["expected"];
}

export async function getFilteredComplianceData(
  filters: DashboardFilters,
  todayDate = new Date()
): Promise<FilteredComplianceData> {
  const categories = await listCategoryNodes();
  const effectiveFilters = {
    ...filters,
    categoryId: getAutoSelectedCategoryId(categories, filters.categoryId)
  };
  const categoryIds = effectiveFilters.categoryId
    ? getDescendantCategoryIds(categories, effectiveFilters.categoryId)
    : undefined;
  const documents = await listDocuments({
    filters: {
      categoryIds,
      fiscalPeriod: effectiveFilters.fiscalPeriod ?? undefined
    },
    limit: 2000
  });
  const periodSourceDocuments = effectiveFilters.fiscalPeriod
    ? await listDocuments({
        filters: {
          categoryIds
        },
        limit: 2000
      })
    : documents;
  const rules = await listPaymentRules();
  const [fromFiscalPeriod, toFiscalPeriod] = getFiscalPeriodRange(
    effectiveFilters.fiscalPeriod,
    todayDate
  );

  return {
    categories,
    compliance: calculateComplianceStatus({
      categories,
      rules,
      documents,
      fromFiscalPeriod,
      toFiscalPeriod,
      targetCategoryIds: getLeafCategoryIds(categories, effectiveFilters.categoryId),
      today: todayDate.toISOString().slice(0, 10)
    }),
    documents,
    filters: effectiveFilters,
    fiscalPeriods: buildAvailableFiscalPeriods(periodSourceDocuments, todayDate)
  };
}

export async function getCurrentMonthPaymentStatusData(
  todayDate = new Date()
): Promise<CurrentMonthPaymentStatusData> {
  const [categories, documents, rules] = await Promise.all([
    listCategoryNodes(),
    listDocuments({ limit: 2000 }),
    listPaymentRules()
  ]);
  const today = todayDate.toISOString().slice(0, 10);
  const [fromFiscalPeriod, toFiscalPeriod] =
    getCurrentMonthStatusFiscalPeriodRange(today);
  const compliance = calculateComplianceStatus({
    categories,
    rules,
    documents,
    fromFiscalPeriod,
    toFiscalPeriod,
    targetCategoryIds: getLeafCategoryIds(categories, null),
    today
  });

  return {
    categories,
    overdue: getOverduePayments(compliance, today),
    today,
    upcoming: getUpcomingPayments(compliance, today)
  };
}

export function getFiscalPeriodRange(
  fiscalPeriod: string | null,
  today = new Date()
): [string, string] {
  if (fiscalPeriod?.includes("-")) {
    return [fiscalPeriod, fiscalPeriod];
  }

  if (fiscalPeriod) {
    return [`${fiscalPeriod}-01`, `${fiscalPeriod}-12`];
  }

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  return [`${year}-01`, `${year}-${month}`];
}

export function getCurrentMonthStatusFiscalPeriodRange(
  today: string
): [string, string] {
  const currentYear = Number(today.slice(0, 4));

  return [`${currentYear - 1}-01`, `${currentYear}-12`];
}
