import type { ProcessingStatus } from "@/db/types";

export interface DocumentFilters {
  categoryIds?: string[];
  fiscalPeriod?: string;
  paymentDateFrom?: string;
  paymentDateTo?: string;
  processingStatus?: ProcessingStatus;
  search?: string;
}

export interface SqlWhereClause {
  where: string;
  values: unknown[];
}

export function buildDocumentWhereClause(
  filters: DocumentFilters
): SqlWhereClause {
  const clauses: string[] = [];
  const values: unknown[] = [];

  const addClause = (clause: string, value: unknown) => {
    values.push(value);
    clauses.push(clause.replace("?", `$${values.length}`));
  };

  if (filters.fiscalPeriod) {
    const [yearText, monthText] = filters.fiscalPeriod.split("-");
    const year = Number(yearText);
    const month = monthText ? Number(monthText) : null;

    if (Number.isInteger(year)) {
      addClause("fiscal_period_year = ?", year);
    }

    if (month && Number.isInteger(month)) {
      addClause("fiscal_period_month = ?", month);
    }
  }

  if (filters.paymentDateFrom) {
    addClause("payment_date >= ?", filters.paymentDateFrom);
  }

  if (filters.paymentDateTo) {
    addClause("payment_date <= ?", filters.paymentDateTo);
  }

  if (filters.processingStatus) {
    addClause("processing_status = ?", filters.processingStatus);
  }

  if (filters.categoryIds?.length) {
    addClause("category_node_id = any(?::bigint[])", filters.categoryIds);
  }

  const search = filters.search?.trim();
  if (search) {
    values.push(`%${search}%`);
    const placeholder = `$${values.length}`;
    clauses.push(
      `(reason ilike ${placeholder} or reference ilike ${placeholder} or issuer ilike ${placeholder})`
    );
  }

  return {
    where: clauses.length ? clauses.join(" and ") : "true",
    values
  };
}
