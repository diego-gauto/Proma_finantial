import { describe, expect, it } from "vitest";

import {
  getCurrentMonthStatusFiscalPeriodRange,
  getFiscalPeriodRange
} from "./dashboard-compliance";

describe("getFiscalPeriodRange", () => {
  it("keeps a selected month as an exact fiscal-period range", () => {
    expect(getFiscalPeriodRange("2026-09", new Date("2026-09-04"))).toEqual([
      "2026-09",
      "2026-09"
    ]);
  });

  it("expands a selected year to the whole fiscal year", () => {
    expect(getFiscalPeriodRange("2026", new Date("2026-09-04"))).toEqual([
      "2026-01",
      "2026-12"
    ]);
  });

  it("defaults to current year through current month", () => {
    expect(getFiscalPeriodRange(null, new Date("2026-09-04"))).toEqual([
      "2026-01",
      "2026-09"
    ]);
  });
});

describe("getCurrentMonthStatusFiscalPeriodRange", () => {
  it("covers prior-year fiscal periods that can be paid in the current month", () => {
    expect(getCurrentMonthStatusFiscalPeriodRange("2026-09-04")).toEqual([
      "2025-01",
      "2026-12"
    ]);
  });
});
