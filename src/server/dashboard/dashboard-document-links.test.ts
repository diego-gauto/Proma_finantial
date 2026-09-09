import { describe, expect, it } from "vitest";

import { buildDashboardDocumentReviewHref } from "./dashboard-document-links";

describe("buildDashboardDocumentReviewHref", () => {
  it("opens a document review popup while preserving dashboard filters", () => {
    expect(
      buildDashboardDocumentReviewHref("doc-1", {
        categoryId: "leaf",
        fiscalPeriod: "2026-08"
      })
    ).toBe("/?fiscalPeriod=2026-08&categoryId=leaf&reviewDocumentId=doc-1");
  });

  it("builds a close href that removes only the popup document", () => {
    expect(
      buildDashboardDocumentReviewHref(null, {
        categoryId: "leaf",
        fiscalPeriod: "2026-08"
      })
    ).toBe("/?fiscalPeriod=2026-08&categoryId=leaf");
  });
});
