import { describe, expect, it } from "vitest";

import { getOverduePayments } from "./get-overdue-payments";
import type { ComplianceStatus } from "./compliance-types";

describe("getOverduePayments", () => {
  it("returns overdue expected periods ordered by due date", () => {
    const status = {
      overdue: [
        { fiscalPeriod: "2026-02", dueDate: "2026-03-10" },
        { fiscalPeriod: "2026-01", dueDate: "2026-02-10" }
      ]
    } as ComplianceStatus;

    expect(getOverduePayments(status).map((period) => period.fiscalPeriod)).toEqual([
      "2026-01",
      "2026-02"
    ]);
  });
});
