import { describe, expect, it } from "vitest";

import { getComplianceIssuePagination } from "./compliance-issue-pagination";

describe("getComplianceIssuePagination", () => {
  it("paginates issue tables in pages of 20 rows", () => {
    expect(getComplianceIssuePagination(45, 0)).toEqual({
      boundedPageIndex: 0,
      firstRowIndex: 0,
      lastRowIndex: 20,
      pageCount: 3
    });

    expect(getComplianceIssuePagination(45, 2)).toEqual({
      boundedPageIndex: 2,
      firstRowIndex: 40,
      lastRowIndex: 45,
      pageCount: 3
    });
  });

  it("bounds invalid page indexes", () => {
    expect(getComplianceIssuePagination(45, 9).boundedPageIndex).toBe(2);
    expect(getComplianceIssuePagination(45, -1).boundedPageIndex).toBe(0);
  });
});
