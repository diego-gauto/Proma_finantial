import { describe, expect, it } from "vitest";

import {
  buildAvailableFiscalPeriods,
  buildDashboardQuery,
  getAutoSelectedCategoryId,
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

  it("returns the dashboard path when every filter is cleared", () => {
    expect(
      buildDashboardQuery({
        fiscalPeriod: null,
        categoryId: null
      })
    ).toBe("/");
  });
});

describe("buildAvailableFiscalPeriods", () => {
  it("includes months up to the current month for the current year", () => {
    expect(buildAvailableFiscalPeriods([], new Date("2026-08-28"))).toEqual([
      "2026",
      "2026-01",
      "2026-02",
      "2026-03",
      "2026-04",
      "2026-05",
      "2026-06",
      "2026-07",
      "2026-08"
    ]);
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

describe("getAutoSelectedCategoryId", () => {
  it("walks through active single-child categories", () => {
    expect(
      getAutoSelectedCategoryId(
        [
          ...categories,
          {
            id: "grandchild",
            parentId: "child",
            name: "Grandchild",
            active: true,
            sortOrder: 1,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
          }
        ],
        "root"
      )
    ).toBe("grandchild");
  });

  it("stops when a category has multiple active children", () => {
    expect(
      getAutoSelectedCategoryId(
        [
          ...categories,
          {
            id: "second-child",
            parentId: "root",
            name: "Second child",
            active: true,
            sortOrder: 2,
            createdAt: "2026-01-01T00:00:00.000Z",
            updatedAt: "2026-01-01T00:00:00.000Z"
          }
        ],
        "root"
      )
    ).toBe("root");
  });

  it("does not auto-select when no category is selected", () => {
    expect(getAutoSelectedCategoryId(categories, null)).toBeNull();
  });
});
