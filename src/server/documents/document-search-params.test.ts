import { describe, expect, it } from "vitest";

import { parseDocumentSearchParams } from "./document-search-params";

describe("parseDocumentSearchParams", () => {
  it("parses document filters from query params", () => {
    expect(
      parseDocumentSearchParams({
        categoryId: "12",
        fiscalPeriod: "2026-08",
        paymentDateFrom: "2026-08-01",
        paymentDateTo: "2026-08-31",
        processingStatus: "review_required",
        search: "telefono"
      })
    ).toEqual({
      categoryId: "12",
      fiscalPeriod: "2026-08",
      paymentDateFrom: "2026-08-01",
      paymentDateTo: "2026-08-31",
      processingStatus: "review_required",
      search: "telefono",
      status: null
    });
  });

  it("keeps operational missing and duplicate views separate from processing status", () => {
    expect(
      parseDocumentSearchParams({
        status: "duplicates",
        processingStatus: "processed"
      })
    ).toEqual({
      categoryId: null,
      fiscalPeriod: null,
      paymentDateFrom: null,
      paymentDateTo: null,
      processingStatus: "processed",
      search: null,
      status: "duplicates"
    });
  });

  it("ignores unsupported statuses", () => {
    expect(
      parseDocumentSearchParams({
        status: "unknown",
        processingStatus: "archived"
      })
    ).toEqual({
      categoryId: null,
      fiscalPeriod: null,
      paymentDateFrom: null,
      paymentDateTo: null,
      processingStatus: null,
      search: null,
      status: null
    });
  });
});
