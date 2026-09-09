export const complianceIssuePageSize = 20;

export interface ComplianceIssuePagination {
  boundedPageIndex: number;
  firstRowIndex: number;
  lastRowIndex: number;
  pageCount: number;
}

export function getComplianceIssuePagination(
  rowCount: number,
  pageIndex: number,
  pageSize = complianceIssuePageSize
): ComplianceIssuePagination {
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));
  const boundedPageIndex = Math.min(Math.max(0, pageIndex), pageCount - 1);
  const firstRowIndex = boundedPageIndex * pageSize;

  return {
    boundedPageIndex,
    firstRowIndex,
    lastRowIndex: Math.min(firstRowIndex + pageSize, rowCount),
    pageCount
  };
}
