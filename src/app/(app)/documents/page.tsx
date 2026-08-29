import Link from "next/link";

import { DocumentFilters } from "@/components/documents/DocumentFilters";
import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { listDocuments } from "@/db/documents.repository";
import { listPaymentRules } from "@/db/payment-rules.repository";
import {
  getCategoryBreadcrumbs,
  getDescendantCategoryIds
} from "@/server/categories/category-tree";
import { calculateComplianceStatus } from "@/server/compliance/calculate-status";
import type { ComplianceStatus } from "@/server/compliance/compliance-types";
import { parseDocumentSearchParams } from "@/server/documents/document-search-params";
import { buildDocumentTableRows } from "@/server/documents/document-display";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface DocumentsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DocumentsPage({ searchParams }: DocumentsPageProps) {
  const filters = parseDocumentSearchParams(await searchParams);
  const categories = await listCategoryNodes();
  const categoryIds = filters.categoryId
    ? getDescendantCategoryIds(categories, filters.categoryId)
    : undefined;
  const documents = await listDocuments({
    filters: {
      categoryIds,
      fiscalPeriod: filters.fiscalPeriod ?? undefined,
      paymentDateFrom: filters.paymentDateFrom ?? undefined,
      paymentDateTo: filters.paymentDateTo ?? undefined,
      processingStatus: filters.processingStatus ?? undefined,
      search: filters.search ?? undefined
    },
    limit: 250
  });
  const compliance = await getComplianceForFilters(
    categories,
    filters.fiscalPeriod,
    categoryIds
  );
  const tableRows = buildDocumentTableRows(categories, documents);

  return (
    <div className={styles.page}>
      <Card
        actions={<Link href="/documents/review">Cola de revision</Link>}
        title="Documentos"
      >
        <DocumentFilters categories={categories} filters={filters} />
      </Card>

      {filters.status === "missing" ? (
        <MissingPeriodsView categories={categories} missing={compliance.missing} />
      ) : null}

      {filters.status === "duplicates" ? (
        <DuplicateGroupsView
          categories={categories}
          duplicates={compliance.duplicates}
        />
      ) : null}

      <Card title="Listado general">
        <div className={styles.summary}>
          <span>
            <strong>{tableRows.length}</strong> documentos encontrados
          </span>
          <span>Maximo 250 resultados por vista</span>
        </div>
        <DocumentsTable rows={tableRows} />
      </Card>
    </div>
  );
}

async function getComplianceForFilters(
  categories: Awaited<ReturnType<typeof listCategoryNodes>>,
  fiscalPeriod: string | null,
  categoryIds: string[] | undefined
): Promise<ComplianceStatus> {
  const documents = await listDocuments({
    filters: {
      categoryIds,
      fiscalPeriod: fiscalPeriod ?? undefined
    },
    limit: 1000
  });
  const rules = await listPaymentRules();
  const [fromFiscalPeriod, toFiscalPeriod] = getFiscalPeriodRange(fiscalPeriod);

  return calculateComplianceStatus({
    categories,
    documents,
    fromFiscalPeriod,
    rules,
    toFiscalPeriod,
    today: new Date().toISOString().slice(0, 10)
  });
}

function MissingPeriodsView({
  categories,
  missing
}: {
  categories: Awaited<ReturnType<typeof listCategoryNodes>>;
  missing: ComplianceStatus["missing"];
}) {
  return (
    <Card title="Faltantes por periodo estimado">
      {missing.length ? (
        <div className={styles.tableScroller}>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Periodo esperado</th>
                <th>Vencimiento</th>
                <th>Regla</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {missing.map((period) => (
                <tr key={`${period.categoryNodeId}-${period.fiscalPeriod}`}>
                  <td>{getCategoryLabel(categories, period.categoryNodeId)}</td>
                  <td>{period.fiscalPeriod}</td>
                  <td>{period.dueDate}</td>
                  <td>{period.rule.name}</td>
                  <td>
                    <Link
                      href={`/documents?categoryId=${period.categoryNodeId}&fiscalPeriod=${period.fiscalPeriod}`}
                    >
                      Ver categoria
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>No hay faltantes para estos filtros.</p>
      )}
    </Card>
  );
}

function DuplicateGroupsView({
  categories,
  duplicates
}: {
  categories: Awaited<ReturnType<typeof listCategoryNodes>>;
  duplicates: ComplianceStatus["duplicates"];
}) {
  return (
    <Card title="Posibles duplicados">
      {duplicates.length ? (
        <div className={styles.tableScroller}>
          <table className={styles.simpleTable}>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Periodo fiscal</th>
                <th>Documentos</th>
                <th>Accion</th>
              </tr>
            </thead>
            <tbody>
              {duplicates.map((duplicate) => (
                <tr
                  key={`${duplicate.categoryNodeId}-${duplicate.fiscalPeriod}`}
                >
                  <td>{getCategoryLabel(categories, duplicate.categoryNodeId)}</td>
                  <td>{duplicate.fiscalPeriod}</td>
                  <td>{duplicate.documentIds.length}</td>
                  <td>
                    <Link
                      href={`/documents?categoryId=${duplicate.categoryNodeId}&fiscalPeriod=${duplicate.fiscalPeriod}`}
                    >
                      Ver grupo
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className={styles.empty}>No hay duplicados para estos filtros.</p>
      )}
    </Card>
  );
}

function getFiscalPeriodRange(fiscalPeriod: string | null): [string, string] {
  if (fiscalPeriod?.includes("-")) {
    return [fiscalPeriod, fiscalPeriod];
  }

  if (fiscalPeriod) {
    return [`${fiscalPeriod}-01`, `${fiscalPeriod}-12`];
  }

  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  return [`${year}-01`, `${year}-${month}`];
}

function getCategoryLabel(
  categories: Awaited<ReturnType<typeof listCategoryNodes>>,
  categoryId: string
): string {
  const breadcrumbs = getCategoryBreadcrumbs(categories, categoryId);
  return breadcrumbs.length ? breadcrumbs.join(" / ") : categoryId;
}
