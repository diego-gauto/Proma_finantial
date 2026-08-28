import type { CategoryNodeRow, DocumentRow } from "@/db/types";

export interface DashboardFilters {
  fiscalPeriod: string | null;
  categoryId: string | null;
}

export interface CategoryFilterLevel {
  parentId: string | null;
  categories: CategoryNodeRow[];
}

type SearchParamValue = string | string[] | undefined;

export function parseDashboardFilters(
  searchParams: Record<string, SearchParamValue>
): DashboardFilters {
  return {
    fiscalPeriod: getFirstValue(searchParams.fiscalPeriod),
    categoryId: getFirstValue(searchParams.categoryId)
  };
}

export function buildDashboardQuery(filters: DashboardFilters): string {
  const params = new URLSearchParams();

  if (filters.fiscalPeriod) {
    params.set("fiscalPeriod", filters.fiscalPeriod);
  }

  if (filters.categoryId) {
    params.set("categoryId", filters.categoryId);
  }

  const query = params.toString();
  return query ? `?${query}` : "/";
}

export function buildAvailableFiscalPeriods(
  documents: DocumentRow[],
  today = new Date()
): string[] {
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;
  const years = new Set<number>([currentYear]);

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
    .sort((a, b) => b - a)
    .flatMap((year) => {
      const monthCount = year === currentYear ? currentMonth : 12;
      const months = Array.from({ length: monthCount }, (_, index) => {
        const month = String(index + 1).padStart(2, "0");
        return `${year}-${month}`;
      });

      return [String(year), ...months];
    });
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
