import type { CategoryNodeRow, DocumentRow } from "@/db/types";

export interface CategorySpendItem {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  paymentCount: number;
}

export interface CategorySpend {
  totalAmount: number;
  items: CategorySpendItem[];
}

interface CategorySpendOptions {
  selectedCategoryId?: string | null;
}

export function getCategorySpend(
  categories: CategoryNodeRow[],
  documents: DocumentRow[],
  options: CategorySpendOptions = {}
): CategorySpend {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category])
  );
  const directChildrenByParentId = new Map<string, CategoryNodeRow[]>();

  for (const category of categories) {
    if (!category.parentId) {
      continue;
    }

    const siblings = directChildrenByParentId.get(category.parentId) ?? [];
    siblings.push(category);
    directChildrenByParentId.set(category.parentId, siblings);
  }

  const totals = new Map<string, { amount: number; paymentCount: number }>();

  for (const document of documents) {
    if (
      document.processingStatus !== "processed" ||
      !document.categoryNodeId ||
      !document.amount
    ) {
      continue;
    }

    const category = categoriesById.get(document.categoryNodeId);
    const bucket = options.selectedCategoryId
      ? getDirectChildBucket(
          categoriesById,
          directChildrenByParentId,
          document.categoryNodeId,
          options.selectedCategoryId
        )
      : getRootCategory(categoriesById, document.categoryNodeId);

    if (!category || !bucket) {
      continue;
    }

    const current = totals.get(bucket.id) ?? { amount: 0, paymentCount: 0 };
    current.amount += Number(document.amount);
    current.paymentCount += 1;
    totals.set(bucket.id, current);
  }

  const totalAmount = [...totals.values()].reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const items = [...totals.entries()]
    .map(([categoryId, total]) => ({
      categoryId,
      categoryName: categoriesById.get(categoryId)?.name ?? "Sin categoria",
      amount: roundCurrency(total.amount),
      percentage: totalAmount ? roundPercent((total.amount / totalAmount) * 100) : 0,
      paymentCount: total.paymentCount
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalAmount: roundCurrency(totalAmount),
    items
  };
}

function getDirectChildBucket(
  categoriesById: Map<string, CategoryNodeRow>,
  directChildrenByParentId: Map<string, CategoryNodeRow[]>,
  categoryId: string,
  selectedCategoryId: string
): CategoryNodeRow | null {
  const selectedCategory = categoriesById.get(selectedCategoryId);
  const documentCategory = categoriesById.get(categoryId);

  if (!selectedCategory || !documentCategory) {
    return null;
  }

  if (categoryId === selectedCategoryId) {
    return selectedCategory;
  }

  let current: CategoryNodeRow | undefined = documentCategory;
  let childOfSelected: CategoryNodeRow | null = null;

  while (current) {
    if (current.parentId === selectedCategoryId) {
      childOfSelected = current;
      break;
    }

    current = current.parentId ? categoriesById.get(current.parentId) : undefined;
  }

  return childOfSelected;
}

function getRootCategory(
  categoriesById: Map<string, CategoryNodeRow>,
  categoryId: string
): CategoryNodeRow | null {
  let current = categoriesById.get(categoryId) ?? null;
  let root = current;

  while (current?.parentId) {
    current = categoriesById.get(current.parentId) ?? null;
    root = current ?? root;
  }

  return root;
}

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundPercent(value: number): number {
  return Math.round(value * 10) / 10;
}
