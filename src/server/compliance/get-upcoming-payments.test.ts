import { describe, expect, it } from "vitest";

import { getUpcomingPayments } from "./get-upcoming-payments";
import type { ComplianceStatus } from "./compliance-types";

describe("getUpcomingPayments", () => {
  it("returns upcoming expected periods from the current month ordered by due date", () => {
    const status = {
      unpaid: [
        { fiscalPeriod: "2026-02", dueDate: "2026-03-10" },
        { fiscalPeriod: "2026-01", dueDate: "2026-02-10" },
        { fiscalPeriod: "2026-03", dueDate: "2026-03-05" },
        { fiscalPeriod: "2026-04", dueDate: "2026-03-01" }
      ]
    } as ComplianceStatus;

    expect(
      getUpcomingPayments(status, "2026-03-04").map(
        (period) => period.fiscalPeriod
      )
    ).toEqual([
      "2026-03",
      "2026-02"
    ]);
  });
});
