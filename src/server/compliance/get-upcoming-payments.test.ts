import { describe, expect, it } from "vitest";

import { getUpcomingPayments } from "./get-upcoming-payments";
import type { ComplianceStatus } from "./compliance-types";

describe("getUpcomingPayments", () => {
  it("returns upcoming expected periods ordered by due date", () => {
    const status = {
      upcoming: [
        { fiscalPeriod: "2026-02", dueDate: "2026-03-10" },
        { fiscalPeriod: "2026-01", dueDate: "2026-02-10" }
      ]
    } as ComplianceStatus;

    expect(getUpcomingPayments(status).map((period) => period.fiscalPeriod)).toEqual([
      "2026-01",
      "2026-02"
    ]);
  });
});
