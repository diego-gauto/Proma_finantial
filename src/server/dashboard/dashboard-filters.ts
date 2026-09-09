import type { CategoryNodeRow, DocumentRow } from "@/db/types";

export interface DashboardFilters {
  fiscalPeriod: string | null;
  categoryId: string | null;
}

export interface CategoryFilterLevel {
  parentId: string | null;
  categories: CategoryNodeRow[];
}

export interface FiscalPeriodStage {
  selectedYear: string;
  sideYears: string[];
  visibleMonths: string[];
}

type SearchParamValue = string | string[] | undefined;

const demoFiscalYears = [2024, 2025];

export function parseDashboardFilters(
  searchParams: Record<string, SearchParamValue>,
  today = new Date()
): DashboardFilters {
  return {
    fiscalPeriod:
      getFirstValue(searchParams.fiscalPeriod) ?? String(today.getFullYear()),
    categoryId: getFirstValue(searchParams.categoryId)
  };
}

export function buildDashboardQuery(
  filters: DashboardFilters,
  pathname = "/",
  extraParams: Record<string, string | null | undefined> = {}
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(extraParams)) {
    if (value) {
      params.set(key, value);
    }
  }

  if (filters.fiscalPeriod) {
    params.set("fiscalPeriod", filters.fiscalPeriod);
  }

  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  const query = params.toString();
  if (pathname === "/") {
    return query ? `?${query}` : "/";
  }

  return query ? `${pathname}?${query}` : pathname;
}

export function buildAvailableFiscalPeriods(
  documents: DocumentRow[],
  today = new Date()
): string[] {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const years = new Set<number>([...demoFiscalYears, currentYear]);

  for (const document of documents) {
    if (!document.fiscalPeriod) {
      continue;
    }

    const year = Number(document.fiscalPeriod.slice(0, 4));
    if (Number.isInteger(year)) {
      years.add(year);
    }
  }

  return [...years]
    .sort((a, b) => a - b)
    .flatMap((year) => {
      const monthCount = year === currentYear ? currentMonth : 12;
      const months = Array.from({ length: monthCount }, (_, index) => {
        const month = String(index + 1).padStart(2, "0");
        return `${year}-${month}`;
      });

      return [String(year), ...months];
    });
}

export function getMonthlyFiscalYear(
  fiscalPeriod: string | null,
  today = new Date()
): string | null {
  if (fiscalPeriod?.includes("-")) {
    return null;
  }

  return fiscalPeriod ?? String(today.getFullYear());
}

export function getFiscalPeriodStage(
  periods: string[],
  fiscalPeriod: string | null,
  today = new Date()
): FiscalPeriodStage {
  const currentYear = String(today.getFullYear());
  const selectedYear = fiscalPeriod?.slice(0, 4) ?? currentYear;
  const years = periods
    .filter((period) => /^\d{4}$/.test(period))
    .filter((period, index, items) => items.indexOf(period) === index);

  return {
    selectedYear,
    sideYears: years.filter((year) => year !== selectedYear),
    visibleMonths: periods.filter((period) =>
      period.startsWith(`${selectedYear}-`)
    )
  };
}

export function shouldRevealFiscalMonths(): boolean {
  return true;
}

export function getCategoryFilterLevels(
  categories: CategoryNodeRow[],
  selectedCategoryId: string | null
): CategoryFilterLevel[] {
  const levels: CategoryFilterLevel[] = [];
  const selectedPath = selectedCategoryId
    ? getSelectedPath(categories, selectedCategoryId)
    : [];
  const parentsToShow = [null, ...selectedPath];

  for (const parentId of parentsToShow) {
    const children = sortCategories(
      categories.filter(
        (category) => category.parentId === parentId && category.active
      )
    );

    if (!children.length) {
      continue;
    }

    levels.push({
      parentId,
      categories: children
    });
  }

  return levels;
}

export function getAutoSelectedCategoryId(
  categories: CategoryNodeRow[],
  selectedCategoryId: string | null
): string | null {
  if (!selectedCategoryId) {
    return null;
  }

  let currentCategoryId = selectedCategoryId;
  const visitedCategoryIds = new Set<string>();

  while (true) {
    if (visitedCategoryIds.has(currentCategoryId)) {
      return currentCategoryId;
    }

    visitedCategoryIds.add(currentCategoryId);

    const activeChildren = sortCategories(
      categories.filter(
        (category) =>
          category.parentId === currentCategoryId && category.active
      )
    );

    if (activeChildren.length !== 1) {
      return currentCategoryId;
    }

    currentCategoryId = activeChildren[0].id;
  }
}

function getFirstValue(value: SearchParamValue): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function sortCategories(categories: CategoryNodeRow[]): CategoryNodeRow[] {
  return [...categories].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

function getSelectedPath(
  categories: CategoryNodeRow[],
  selectedCategoryId: string
): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: string[] = [];
  let current = byId.get(selectedCategoryId);

  while (current) {
    path.unshift(current.id);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}
