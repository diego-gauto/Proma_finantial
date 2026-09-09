import { describe, expect, it } from "vitest";

import {
  buildCategoryTree,
  getCategoryBreadcrumbs,
  getDescendantCategoryIds,
  getLeafCategoryIds
} from "./category-tree";

const categories = [
  {
    id: "services",
    parentId: null,
    name: "Servicios",
    active: true,
    sortOrder: 2,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "taxes",
    parentId: null,
    name: "Impuestos",
    active: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "phone",
    parentId: "services",
    name: "Telefonia",
    active: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "account-032",
    parentId: "phone",
    name: "Cuenta 032",
    active: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

describe("buildCategoryTree", () => {
  it("builds a sorted hierarchy from flat category rows", () => {
    const tree = buildCategoryTree(categories);

    expect(tree.map((node) => node.id)).toEqual(["taxes", "services"]);
    expect(tree[1]?.children[0]?.children[0]?.id).toBe("account-032");
  });
});

describe("getCategoryBreadcrumbs", () => {
  it("returns category names from root to selected node", () => {
    expect(getCategoryBreadcrumbs(categories, "account-032")).toEqual([
      "Servicios",
      "Telefonia",
      "Cuenta 032"
    ]);
  });
});

describe("getDescendantCategoryIds", () => {
  it("includes the selected category and all descendants", () => {
    expect(getDescendantCategoryIds(categories, "services")).toEqual([
      "services",
      "phone",
      "account-032"
    ]);
  });
});

describe("getLeafCategoryIds", () => {
  it("returns active leaves instead of grouping parents", () => {
    expect(getLeafCategoryIds(categories)).toEqual(["account-032", "taxes"]);
  });

  it("returns the leaves below a selected category", () => {
    expect(getLeafCategoryIds(categories, "services")).toEqual([
      "account-032"
    ]);
  });

  it("returns the selected category when it has no active children", () => {
    expect(getLeafCategoryIds(categories, "taxes")).toEqual(["taxes"]);
  });
});
