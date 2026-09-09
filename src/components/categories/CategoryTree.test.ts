import { describe, expect, it } from "vitest";

import { buildHorizontalTreeLayout } from "./CategoryTree";
import type { CategoryTreeNode } from "@/server/categories/category-tree";

const baseNode = {
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  parentId: null,
  sortOrder: 0,
  updatedAt: "2026-01-01T00:00:00.000Z"
};

describe("buildHorizontalTreeLayout", () => {
  it("grows node height for long category names and keeps them inside the canvas", () => {
    const root: CategoryTreeNode = {
      ...baseNode,
      children: [],
      id: "long",
      name: "Ceibo Gestion G mail Grupo media con nombre de categoria extendido"
    };

    const layout = buildHorizontalTreeLayout(root);
    const node = layout.nodes[0];

    expect(node?.height).toBeGreaterThan(132);
    expect(node?.y).toBeGreaterThanOrEqual(16);
    expect(node ? node.y + node.height : 0).toBeLessThanOrEqual(layout.height);
  });
});
