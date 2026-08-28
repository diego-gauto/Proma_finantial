import type { CategoryNodeRow } from "@/db/types";

export interface CategoryTreeNode extends CategoryNodeRow {
  children: CategoryTreeNode[];
}

function sortCategories<T extends { name: string; sortOrder: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return a.name.localeCompare(b.name);
  });
}

export function buildCategoryTree(
  categories: CategoryNodeRow[]
): CategoryTreeNode[] {
  const nodes = new Map<string, CategoryTreeNode>();

  for (const category of categories) {
    nodes.set(category.id, { ...category, children: [] });
  }

  const roots: CategoryTreeNode[] = [];

  for (const node of nodes.values()) {
    if (node.parentId && nodes.has(node.parentId)) {
      nodes.get(node.parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  }

  const sortChildren = (node: CategoryTreeNode) => {
    node.children = sortCategories(node.children);
    node.children.forEach(sortChildren);
  };

  const sortedRoots = sortCategories(roots);
  sortedRoots.forEach(sortChildren);

  return sortedRoots;
}

export function getCategoryBreadcrumbs(
  categories: CategoryNodeRow[],
  categoryId: string
): string[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const breadcrumbs: string[] = [];
  let current = byId.get(categoryId);

  while (current) {
    breadcrumbs.unshift(current.name);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return breadcrumbs;
}

export function getDescendantCategoryIds(
  categories: CategoryNodeRow[],
  categoryId: string
): string[] {
  const childrenByParent = new Map<string, CategoryNodeRow[]>();

  for (const category of sortCategories(categories)) {
    if (!category.parentId) {
      continue;
    }

    const siblings = childrenByParent.get(category.parentId) ?? [];
    siblings.push(category);
    childrenByParent.set(category.parentId, siblings);
  }

  const ids: string[] = [];
  const visit = (id: string) => {
    ids.push(id);
    for (const child of childrenByParent.get(id) ?? []) {
      visit(child.id);
    }
  };

  visit(categoryId);
  return ids;
}
