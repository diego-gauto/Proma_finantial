import { describe, expect, it } from "vitest";

import {
  buildDashboardQuery,
  getCategoryFilterLevels,
  parseDashboardFilters
} from "./dashboard-filters";
import type { CategoryNodeRow } from "@/db/types";

const categories: CategoryNodeRow[] = [
  {
    id: "root",
    parentId: null,
    name: "Root",
    active: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "child",
    parentId: "root",
    name: "Child",
    active: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

describe("parseDashboardFilters", () => {
  it("keeps fiscal period and category in query params", () => {
    expect(
      parseDashboardFilters({
        fiscalPeriod: "2026-01",
        categoryId: "root"
      })
    ).toEqual({
      fiscalPeriod: "2026-01",
      categoryId: "root"
    });
  });
});

describe("buildDashboardQuery", () => {
  it("serializes filters and removes empty values", () => {
    expect(
      buildDashboardQuery({
        fiscalPeriod: "2026-01",
        categoryId: null
      })
    ).toBe("?fiscalPeriod=2026-01");
  });
});

describe("getCategoryFilterLevels", () => {
  it("shows root categories first and children for the selected category", () => {
    expect(getCategoryFilterLevels(categories, "root")).toEqual([
      {
        parentId: null,
        categories: [categories[0]]
      },
      {
        parentId: "root",
        categories: [categories[1]]
      }
    ]);
  });

  it("keeps the selected path visible for nested categories", () => {
    expect(getCategoryFilterLevels(categories, "child")).toEqual([
      {
        parentId: null,
        categories: [categories[0]]
      },
      {
        parentId: "root",
        categories: [categories[1]]
      }
    ]);
  });
});
