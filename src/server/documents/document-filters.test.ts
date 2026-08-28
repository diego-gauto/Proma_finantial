import { describe, expect, it } from "vitest";

import { buildDocumentWhereClause } from "./document-filters";

describe("buildDocumentWhereClause", () => {
  it("keeps fiscal period and payment date filters separate", () => {
    const filters = buildDocumentWhereClause({
      categoryIds: ["cat-1", "cat-2"],
      fiscalPeriod: "2026-01",
      paymentDateFrom: "2026-02-01",
      paymentDateTo: "2026-02-28",
      processingStatus: "processed",
      search: "fibertel"
    });

    expect(filters.where).toContain("fiscal_period = $1");
    expect(filters.where).toContain("payment_date >= $2");
    expect(filters.where).toContain("payment_date <= $3");
    expect(filters.values).toEqual([
      "2026-01",
      "2026-02-01",
      "2026-02-28",
      "processed",
      ["cat-1", "cat-2"],
      "%fibertel%"
    ]);
  });

  it("returns a true predicate when no filters are selected", () => {
    expect(buildDocumentWhereClause({})).toEqual({
      where: "true",
      values: []
    });
  });
});
