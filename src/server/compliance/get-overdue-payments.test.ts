import { describe, expect, it } from "vitest";

import { getOverduePayments } from "./get-overdue-payments";
import type { ComplianceStatus } from "./compliance-types";

describe("getOverduePayments", () => {
  it("returns unpaid current-month periods whose expected payment date already passed", () => {
    const status = {
      unpaid: [
        { fiscalPeriod: "2026-02", dueDate: "2026-03-10" },
        { fiscalPeriod: "2026-01", dueDate: "2026-02-10" },
        { fiscalPeriod: "2026-03", dueDate: "2026-03-05" },
        { fiscalPeriod: "2026-04", dueDate: "2026-03-18" },
        { fiscalPeriod: "2026-05", dueDate: "2026-03-20" }
      ]
    } as ComplianceStatus;

    expect(
      getOverduePayments(status, "2026-03-18").map(
        (period) => period.fiscalPeriod
      )
    ).toEqual([
      "2026-03",
      "2026-02"
    ]);
  });
});
