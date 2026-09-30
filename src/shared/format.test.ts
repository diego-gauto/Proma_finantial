import { describe, expect, it } from "vitest";

import { formatDisplayDate, formatDisplayDateTime, formatMoney } from "./format";

describe("shared formatters", () => {
  it("formats money with two decimals and Argentine separators", () => {
    expect(formatMoney(44564)).toBe("$ 44.564,00");
    expect(formatMoney("1591360.93")).toBe("$ 1.591.360,93");
    expect(formatMoney("108205", "USD")).toBe("USD 108.205,00");
  });

  it("formats visible dates as dd-mm-yyyy without timezone drift", () => {
    expect(formatDisplayDate("2026-09-02")).toBe("02-09-2026");
    expect(formatDisplayDate("2026-09-02T03:00:00.000Z")).toBe("02-09-2026");
    expect(formatDisplayDate(null)).toBe("Sin fecha");
  });

  it("formats visible date times with the same date shape", () => {
    expect(formatDisplayDateTime("2026-08-28T12:30:00.000Z")).toMatch(
      /^28-08-2026 \d{2}:\d{2}$/
    );
  });
});
