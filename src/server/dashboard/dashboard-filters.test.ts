import { describe, expect, it } from "vitest";

import {
  buildAvailableFiscalPeriods,
  buildDashboardQuery,
  getAutoSelectedCategoryId,
  getCategoryFilterLevels,
  getFiscalPeriodStage,
  getMonthlyFiscalYear,
  shouldRevealFiscalMonths,
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
  it("defaults fiscal period to the current year", () => {
    expect(parseDashboardFilters({}, new Date("2026-08-29"))).toEqual({
      fiscalPeriod: "2026",
      categoryId: null
    });
  });

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

  it("can target a non-dashboard route", () => {
    expect(
      buildDashboardQuery(
        {
          fiscalPeriod: "2026-08",
          categoryId: "leaf"
        },
        "/documents"
      )
    ).toBe("/documents?fiscalPeriod=2026-08&categoryId=leaf");
  });

  it("preserves extra query params when changing filters", () => {
    expect(
      buildDashboardQuery(
        {
          fiscalPeriod: "2026-08",
          categoryId: "leaf"
        },
        "/",
        { tab: "faltantes" }
      )
    ).toBe("?tab=faltantes&fiscalPeriod=2026-08&categoryId=leaf");
  });
});

describe("buildAvailableFiscalPeriods", () => {
  it("includes demo fiscal years and current year months", () => {
    expect(buildAvailableFiscalPeriods([], new Date("2026-08-28"))).toEqual([
      "2024",
      "2024-01",
      "2024-02",
      "2024-03",
      "2024-04",
      "2024-05",
      "2024-06",
      "2024-07",
      "2024-08",
      "2024-09",
      "2024-10",
      "2024-11",
      "2024-12",
      "2025",
      "2025-01",
      "2025-02",
      "2025-03",
      "2025-04",
      "2025-05",
      "2025-06",
      "2025-07",
      "2025-08",
      "2025-09",
      "2025-10",
      "2025-11",
      "2025-12",
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

describe("getMonthlyFiscalYear", () => {
  it("uses the current year when no fiscal period is selected", () => {
    expect(getMonthlyFiscalYear(null, new Date("2026-08-29"))).toBe("2026");
  });

  it("uses the selected fiscal year and omits monthly period charts", () => {
    expect(getMonthlyFiscalYear("2026", new Date("2026-08-29"))).toBe("2026");
    expect(getMonthlyFiscalYear("2026-08", new Date("2026-08-29"))).toBeNull();
  });
});

describe("getFiscalPeriodStage", () => {
  it("centers the selected year and exposes only that year months", () => {
    expect(
      getFiscalPeriodStage(
        [
          "2024",
          "2024-01",
          "2026",
          "2026-01",
          "2026-02",
          "2025",
          "2025-01",
          "2025-02"
        ],
        "2025-02",
        new Date("2026-08-30")
      )
    ).toEqual({
      sideYears: ["2024", "2026"],
      selectedYear: "2025",
      visibleMonths: ["2025-01", "2025-02"]
    });
  });

  it("defaults the center year to the current year", () => {
    expect(
      getFiscalPeriodStage(["2026", "2026-01"], null, new Date("2026-08-30"))
    ).toEqual({
      sideYears: [],
      selectedYear: "2026",
      visibleMonths: ["2026-01"]
    });
  });
});

describe("shouldRevealFiscalMonths", () => {
  it("keeps months visible because the current fiscal year is selected by default", () => {
    expect(shouldRevealFiscalMonths()).toBe(true);
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
