import { getDbPool } from "@/db/client";
import type { DocumentRow } from "@/db/types";
import {
  buildDocumentWhereClause,
  type DocumentFilters
} from "@/server/documents/document-filters";

interface DocumentDbRow {
  id: string;
  drive_file_id: string | null;
  drive_url: string | null;
  file_name: string | null;
  drive_path: string | null;
  category_node_id: string | null;
  payment_date: string | null;
  payment_time: string | null;
  fiscal_period: string | null;
  fiscal_period_kind: DocumentRow["fiscalPeriodKind"];
  amount: string | null;
  currency: string | null;
  reason: string | null;
  reference: string | null;
  issuer: string | null;
  payee: string | null;
  user_note: string | null;
  raw_text: string | null;
  extracted_data: unknown;
  processing_status: DocumentRow["processingStatus"];
  processing_error: string | null;
  created_at: Date;
  updated_at: Date;
}

function toDocument(row: DocumentDbRow): DocumentRow {
  return {
    id: row.id,
    driveFileId: row.drive_file_id,
    driveUrl: row.drive_url,
    fileName: row.file_name,
    drivePath: row.drive_path,
    categoryNodeId: row.category_node_id,
    paymentDate: row.payment_date,
    paymentTime: row.payment_time,
    fiscalPeriod: row.fiscal_period,
    fiscalPeriodKind: row.fiscal_period_kind,
    amount: row.amount,
    currency: row.currency,
    reason: row.reason,
    reference: row.reference,
    issuer: row.issuer,
    payee: row.payee,
    userNote: row.user_note,
    rawText: row.raw_text,
    extractedData: row.extracted_data,
    processingStatus: row.processing_status,
    processingError: row.processing_error,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString()
  };
}

export interface ListDocumentsOptions {
  filters?: DocumentFilters;
  limit?: number;
  offset?: number;
}

const documentSelect = `
  select
    id,
    drive_file_id,
    drive_url,
    file_name,
    drive_path,
    category_node_id,
    payment_date::text,
    payment_time::text,
    case
      when fiscal_period_year is null then null
      when fiscal_period_kind = 'year' or fiscal_period_month is null then fiscal_period_year::text
      else fiscal_period_year::text || '-' || lpad(fiscal_period_month::text, 2, '0')
    end as fiscal_period,
    fiscal_period_kind,
    amount::text,
    currency,
    reason,
    reference,
    issuer,
    payee,
    user_note,
    raw_text,
    extracted_data,
    processing_status,
    processing_error,
    created_at,
    updated_at
  from documents
`;

export async function listDocuments({
  filters = {},
  limit = 50,
  offset = 0
}: ListDocumentsOptions = {}): Promise<DocumentRow[]> {
  const { where, values } = buildDocumentWhereClause(filters);
  const result = await getDbPool().query<DocumentDbRow>(
    `
      ${documentSelect}
      where ${where}
      order by payment_date desc nulls last, created_at desc
      limit $${values.length + 1}
      offset $${values.length + 2}
    `,
    [...values, limit, offset]
  );

  return result.rows.map(toDocument);
}

export async function listProcessedDocuments(
  options: Omit<ListDocumentsOptions, "filters"> & {
    filters?: Omit<DocumentFilters, "processingStatus">;
  } = {}
): Promise<DocumentRow[]> {
  return listDocuments({
    ...options,
    filters: {
      ...options.filters,
      processingStatus: "processed"
    }
  });
}

export async function listReviewDocuments(
  options: Omit<ListDocumentsOptions, "filters"> = {}
): Promise<DocumentRow[]> {
  const { where, values } = buildDocumentWhereClause({});
  const result = await getDbPool().query<DocumentDbRow>(
    `
      ${documentSelect}
      where ${where}
        and processing_status in ('review_required', 'error')
      order by updated_at desc
      limit $${values.length + 1}
      offset $${values.length + 2}
    `,
    [...values, options.limit ?? 50, options.offset ?? 0]
  );

  return result.rows.map(toDocument);
}
