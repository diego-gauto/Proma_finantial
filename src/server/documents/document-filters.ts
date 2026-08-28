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
    addClause(
      "(reason ilike ? or reference ilike ? or issuer ilike ?)",
      `%${search}%`
    );
    const placeholder = `$${values.length}`;
    clauses[clauses.length - 1] = clauses[clauses.length - 1]
      .replaceAll(placeholder, `$${values.length}`)
      .replace("?", `$${values.length}`)
      .replace("?", `$${values.length}`);
  }

  return {
    where: clauses.length ? clauses.join(" and ") : "true",
    values
  };
}
