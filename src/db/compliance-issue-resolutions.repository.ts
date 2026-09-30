import { getDbPool } from "@/db/client";
import type {
  ComplianceIssueResolution,
  ComplianceIssueResolutionKind,
  ComplianceIssueType
} from "@/server/compliance/compliance-types";

interface ComplianceIssueResolutionDbRow {
  id: string;
  issue_type: ComplianceIssueType;
  category_node_id: string;
  fiscal_period: string;
  fiscal_period_kind: ComplianceIssueResolution["fiscalPeriodKind"];
  payment_rule_id: string | null;
  duplicate_document_ids: string[] | null;
  fingerprint: string;
  resolution_kind: ComplianceIssueResolutionKind;
  note: string | null;
  resolved_by_user_id: string | null;
  resolved_at: Date;
  active: boolean;
  created_at: Date;
}

export interface ListComplianceIssueResolutionsOptions {
  categoryIds?: string[];
  fromFiscalPeriod: string;
  toFiscalPeriod: string;
}

export interface CreateComplianceIssueResolutionInput {
  issueType: ComplianceIssueType;
  categoryNodeId: string;
  fiscalPeriod: string;
  fiscalPeriodKind: ComplianceIssueResolution["fiscalPeriodKind"];
  paymentRuleId: string | null;
  duplicateDocumentIds: string[] | null;
  fingerprint: string;
  resolutionKind?: ComplianceIssueResolutionKind;
  note?: string | null;
  resolvedByUserId?: string | null;
}

function toComplianceIssueResolution(
  row: ComplianceIssueResolutionDbRow
): ComplianceIssueResolution {
  return {
    id: row.id,
    issueType: row.issue_type,
    categoryNodeId: row.category_node_id,
    fiscalPeriod: row.fiscal_period,
    fiscalPeriodKind: row.fiscal_period_kind,
    paymentRuleId: row.payment_rule_id,
    duplicateDocumentIds: row.duplicate_document_ids,
    fingerprint: row.fingerprint,
    resolutionKind: row.resolution_kind,
    note: row.note,
    resolvedByUserId: row.resolved_by_user_id,
    resolvedAt: row.resolved_at.toISOString(),
    active: row.active,
    createdAt: row.created_at.toISOString()
  };
}

const resolutionSelect = `
  select
    id,
    issue_type,
    category_node_id,
    case
      when fiscal_period_kind = 'year' or fiscal_period_month is null then fiscal_period_year::text
      else fiscal_period_year::text || '-' || lpad(fiscal_period_month::text, 2, '0')
    end as fiscal_period,
    fiscal_period_kind,
    payment_rule_id,
    duplicate_document_ids,
    fingerprint,
    resolution_kind,
    note,
    resolved_by_user_id,
    resolved_at,
    active,
    created_at
  from compliance_issue_resolutions
`;

export async function listActiveComplianceIssueResolutions({
  categoryIds,
  fromFiscalPeriod,
  toFiscalPeriod
}: ListComplianceIssueResolutionsOptions): Promise<ComplianceIssueResolution[]> {
  const values: Array<number | string[]> = [
    fiscalPeriodToComparableMonth(fromFiscalPeriod),
    fiscalPeriodToComparableMonth(toFiscalPeriod)
  ];
  const categoryFilter = categoryIds?.length
    ? `and category_node_id = any($${values.push(categoryIds)}::bigint[])`
    : "";
  const result = await getDbPool().query<ComplianceIssueResolutionDbRow>(
    `
      ${resolutionSelect}
      where active = true
        and (fiscal_period_year::int * 12 + coalesce(fiscal_period_month::int, 1) - 1)
          between $1 and $2
        ${categoryFilter}
      order by resolved_at desc
    `,
    values
  );

  return result.rows.map(toComplianceIssueResolution);
}

export async function createComplianceIssueResolution(
  input: CreateComplianceIssueResolutionInput
): Promise<ComplianceIssueResolution> {
  const fiscalPeriod = parseFiscalPeriod(input.fiscalPeriod);
  const result = await getDbPool().query<ComplianceIssueResolutionDbRow>(
    `
      insert into compliance_issue_resolutions (
        issue_type,
        category_node_id,
        fiscal_period_year,
        fiscal_period_month,
        fiscal_period_kind,
        payment_rule_id,
        duplicate_document_ids,
        fingerprint,
        resolution_kind,
        note,
        resolved_by_user_id
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      on conflict (fingerprint) where active = true do update set
        resolution_kind = excluded.resolution_kind,
        note = excluded.note,
        resolved_by_user_id = excluded.resolved_by_user_id,
        resolved_at = now(),
        updated_at = now()
      returning
        id,
        issue_type,
        category_node_id,
        case
          when fiscal_period_kind = 'year' or fiscal_period_month is null then fiscal_period_year::text
          else fiscal_period_year::text || '-' || lpad(fiscal_period_month::text, 2, '0')
        end as fiscal_period,
        fiscal_period_kind,
        payment_rule_id,
        duplicate_document_ids,
        fingerprint,
        resolution_kind,
        note,
        resolved_by_user_id,
        resolved_at,
        active,
        created_at
    `,
    [
      input.issueType,
      input.categoryNodeId,
      fiscalPeriod.year,
      fiscalPeriod.month,
      input.fiscalPeriodKind,
      input.paymentRuleId,
      input.duplicateDocumentIds,
      input.fingerprint,
      input.resolutionKind ?? "acknowledged",
      input.note ?? null,
      input.resolvedByUserId ?? null
    ]
  );

  return toComplianceIssueResolution(result.rows[0]);
}

function parseFiscalPeriod(fiscalPeriod: string): {
  month: number | null;
  year: number;
} {
  const [yearText, monthText] = fiscalPeriod.split("-");

  return {
    month: monthText ? Number(monthText) : null,
    year: Number(yearText)
  };
}

function fiscalPeriodToComparableMonth(fiscalPeriod: string): number {
  const { month, year } = parseFiscalPeriod(fiscalPeriod);
  return year * 12 + (month ?? 1) - 1;
}
