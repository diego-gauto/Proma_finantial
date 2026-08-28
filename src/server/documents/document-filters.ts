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
    addClause("fiscal_period = ?", filters.fiscalPeriod);
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
    addClause("category_node_id = any(?::uuid[])", filters.categoryIds);
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
