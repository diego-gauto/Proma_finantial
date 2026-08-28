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

export function getCategorySpend(
  categories: CategoryNodeRow[],
  documents: DocumentRow[]
): CategorySpend {
  const categoriesById = new Map(
    categories.map((category) => [category.id, category])
  );
  const totals = new Map<string, { amount: number; paymentCount: number }>();

  for (const document of documents) {
    if (
      document.processingStatus !== "processed" ||
      !document.categoryNodeId ||
      !document.amount
    ) {
      continue;
    }

    const root = getRootCategory(categoriesById, document.categoryNodeId);

    if (!root) {
      continue;
    }

    const current = totals.get(root.id) ?? { amount: 0, paymentCount: 0 };
    current.amount += Number(document.amount);
    current.paymentCount += 1;
    totals.set(root.id, current);
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
