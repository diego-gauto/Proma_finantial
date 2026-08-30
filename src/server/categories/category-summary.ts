import type { CategoryNodeRow, DocumentRow } from "@/db/types";
import { getDescendantCategoryIds } from "@/server/categories/category-tree";

export interface CategorySummary {
  directDocumentCount: number;
  descendantDocumentCount: number;
}

export function getCategorySummaries(
  categories: CategoryNodeRow[],
  documents: DocumentRow[]
): Map<string, CategorySummary> {
  const directCounts = new Map<string, number>();

  for (const document of documents) {
    if (!document.categoryNodeId) {
      continue;
    }

    directCounts.set(
      document.categoryNodeId,
      (directCounts.get(document.categoryNodeId) ?? 0) + 1
    );
  }

  return new Map(
    categories.map((category) => {
      const descendants = getDescendantCategoryIds(categories, category.id);
      const descendantDocumentCount = descendants.reduce(
        (total, categoryId) => total + (directCounts.get(categoryId) ?? 0),
        0
      );

      return [
        category.id,
        {
          directDocumentCount: directCounts.get(category.id) ?? 0,
          descendantDocumentCount
        }
      ];
    })
  );
}
