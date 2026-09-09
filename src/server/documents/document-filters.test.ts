import { describe, expect, it } from "vitest";

import { buildDocumentWhereClause } from "./document-filters";

describe("buildDocumentWhereClause", () => {
  it("keeps fiscal period and payment date filters separate", () => {
    const filters = buildDocumentWhereClause({
      categoryIds: ["1", "2"],
      fiscalPeriod: "2026-01",
      paymentDateFrom: "2026-02-01",
      paymentDateTo: "2026-02-28",
      processingStatus: "processed",
      search: "fibertel"
    });

    expect(filters.where).toContain("fiscal_period_year = $1");
    expect(filters.where).toContain(
      "$2 = any(case when cardinality(covered_fiscal_months) > 0 then covered_fiscal_months else array[fiscal_period_month] end)"
    );
    expect(filters.where).toContain("payment_date >= $3");
    expect(filters.where).toContain("payment_date <= $4");
    expect(filters.where).toContain("category_node_id = any($6::bigint[])");
    expect(filters.where).toContain("file_name ilike $7");
    expect(filters.where).toContain("payee ilike $7");
    expect(filters.values).toEqual([
      2026,
      1,
      "2026-02-01",
      "2026-02-28",
      "processed",
      ["1", "2"],
      "%fibertel%"
    ]);
  });

  it("filters fiscal years without mixing them with payment dates", () => {
    expect(buildDocumentWhereClause({ fiscalPeriod: "2026" })).toEqual({
      where: "fiscal_period_year = $1",
      values: [2026]
    });
  });

  it("matches a fiscal month against the document coverage column", () => {
    expect(buildDocumentWhereClause({ fiscalPeriod: "2026-04" })).toEqual({
      where:
        "fiscal_period_year = $1 and $2 = any(case when cardinality(covered_fiscal_months) > 0 then covered_fiscal_months else array[fiscal_period_month] end)",
      values: [2026, 4]
    });
  });

  it("returns a true predicate when no filters are selected", () => {
    expect(buildDocumentWhereClause({})).toEqual({
      where: "true",
      values: []
    });
  });
});
