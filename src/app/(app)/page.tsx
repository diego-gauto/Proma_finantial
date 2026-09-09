import { CategoryCloudFilter } from "@/components/dashboard/CategoryCloudFilter";
import { CategoryDocumentsList } from "@/components/dashboard/CategoryDocumentsList";
import { CategorySpendPie } from "@/components/dashboard/CategorySpendPie";
import { DuplicateDocumentsCard } from "@/components/dashboard/DuplicateDocumentsCard";
import { FiscalPeriodPaymentCountChart } from "@/components/dashboard/FiscalPeriodPaymentCountChart";
import { FiscalPeriodFilter } from "@/components/dashboard/FiscalPeriodFilter";
import { MissingDocumentsCard } from "@/components/dashboard/MissingDocumentsCard";
import { MonthlyAmountChart } from "@/components/dashboard/MonthlyAmountChart";
import { MonthlyPaymentCountChart } from "@/components/dashboard/MonthlyPaymentCountChart";
import { ReviewRequiredAlert } from "@/components/dashboard/ReviewRequiredAlert";
import { DocumentPreviewPane } from "@/components/documents/DocumentPreviewPane";
import { DocumentReviewForm } from "@/components/documents/DocumentReviewForm";
import { getDocumentById } from "@/db/documents.repository";
import { calculateComplianceStatus } from "@/server/compliance/calculate-status";
import {
  buildAvailableFiscalPeriods,
  getMonthlyFiscalYear,
  parseDashboardFilters
} from "@/server/dashboard/dashboard-filters";
import { getFilteredComplianceData } from "@/server/dashboard/dashboard-compliance";
import { buildDashboardDocumentReviewHref } from "@/server/dashboard/dashboard-document-links";
import { getCategorySpend } from "@/server/dashboard/get-category-spend";
import { getDashboardAlerts } from "@/server/dashboard/get-dashboard-alerts";
import { getFiscalPeriodSeries } from "@/server/dashboard/get-fiscal-period-series";
import { getMonthlySeries } from "@/server/dashboard/get-monthly-series";

import { reviewDocumentAction } from "./documents/review/[id]/actions";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const rawSearchParams = await searchParams;
  const filters = parseDashboardFilters(rawSearchParams);
  const reviewDocumentId = getFirstValue(rawSearchParams.reviewDocumentId);
  const selectedTab = getDashboardTab(rawSearchParams.tab);
  const data = await getDashboardPageData(filters, reviewDocumentId);
  const isSingleFiscalPeriod = Boolean(
    data.filters.fiscalPeriod?.includes("-")
  );

  return (
    <div className={styles.page}>
      <ReviewRequiredAlert alerts={data.alerts} />

      {data.dataNotice ? (
        <section className="notice-panel">
          <h2>Datos pendientes de conexion</h2>
          <p>{data.dataNotice}</p>
        </section>
      ) : null}

      <section className={styles.filtersStack}>
        <FiscalPeriodFilter
          filters={data.filters}
          periods={data.fiscalPeriods}
          queryParams={getDashboardTabQueryParams(selectedTab)}
        />
        <CategoryCloudFilter
          categories={data.categories}
          filters={data.filters}
          queryParams={getDashboardTabQueryParams(selectedTab)}
        />
      </section>

      <section className={styles.tabs} aria-label="Vista del tablero">
        <a
          aria-current={selectedTab === "estadisticas" ? "page" : undefined}
          className={selectedTab === "estadisticas" ? styles.tabActive : ""}
          href={buildDashboardTabHref(rawSearchParams, "estadisticas")}
        >
          Estadisticas
        </a>
        <a
          aria-current={selectedTab === "faltantes" ? "page" : undefined}
          className={selectedTab === "faltantes" ? styles.tabActive : ""}
          href={buildDashboardTabHref(rawSearchParams, "faltantes")}
        >
          Faltantes y duplicados
        </a>
      </section>

      {selectedTab === "estadisticas" ? (
        <>
          <section className={styles.analyticsGrid}>
            <div className="panel">
              <div className="panel-header">
                <h2>Gasto por categoria</h2>
              </div>
              <div className={`panel-body ${styles.spendPanel}`}>
                <CategorySpendPie spend={data.categorySpend} />
                {data.showLeafDocuments ? (
                  <CategoryDocumentsList
                    documents={data.documents}
                    filters={data.filters}
                  />
                ) : null}
              </div>
            </div>
          </section>

          {!isSingleFiscalPeriod ? (
            <section className={styles.monthlyGrid}>
              <FiscalPeriodPaymentCountChart series={data.fiscalPeriodSeries} />
              <MonthlyPaymentCountChart series={data.monthlySeries} />
              <MonthlyAmountChart series={data.monthlySeries} />
            </section>
          ) : null}
        </>
      ) : (
        <section className={styles.actionGrid}>
          <MissingDocumentsCard
            categories={data.categories}
            missing={data.compliance.missing}
          />
          <DuplicateDocumentsCard
            categories={data.categories}
            duplicates={data.compliance.duplicates}
            expected={data.compliance.expected}
          />
        </section>
      )}

      {data.reviewDocument ? (
        <div className={styles.modalBackdrop}>
          <section
            aria-label="Revision de documento"
            className={styles.reviewModal}
          >
            <div className={styles.modalHeader}>
              <h2>Revisar documento</h2>
              <a
                href={buildDashboardDocumentReviewHref(null, data.filters)}
                aria-label="Cerrar revision"
              >
                Cerrar
              </a>
            </div>
            <div className={styles.modalSplit}>
              <div className="panel">
                <div className="panel-header">
                  <h2>Vista del documento</h2>
                </div>
                <div className="panel-body">
                  <DocumentPreviewPane document={data.reviewDocument} />
                </div>
              </div>
              <div className="panel">
                <div className="panel-header">
                  <h2>Datos extraidos</h2>
                </div>
                <div className="panel-body">
                  <DocumentReviewForm
                    action={reviewDocumentAction}
                    cancelHref={buildDashboardDocumentReviewHref(
                      null,
                      data.filters
                    )}
                    categories={data.categories}
                    document={data.reviewDocument}
                    redirectTo={buildDashboardDocumentReviewHref(
                      null,
                      data.filters
                    )}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

type DashboardFilters = ReturnType<typeof parseDashboardFilters>;

async function getDashboardPageData(
  filters: DashboardFilters,
  reviewDocumentId: string | null
) {
  try {
    const filteredData = await getFilteredComplianceData(filters);
    const { categories, compliance, documents, filters: effectiveFilters } =
      filteredData;

    return {
      alerts: getDashboardAlerts({ documents, compliance }),
      categories,
      categorySpend: getCategorySpend(categories, documents, {
        selectedCategoryId: effectiveFilters.categoryId
      }),
      compliance,
      dataNotice: null,
      documents,
      fiscalPeriods: filteredData.fiscalPeriods,
      fiscalPeriodSeries: getFiscalPeriodSeries(documents, {
        fiscalYear: getMonthlyFiscalYear(effectiveFilters.fiscalPeriod)
      }),
      filters: effectiveFilters,
      monthlySeries: getMonthlySeries(documents, {
        fiscalYear: getMonthlyFiscalYear(effectiveFilters.fiscalPeriod)
      }),
      reviewDocument: reviewDocumentId
        ? await getDocumentById(reviewDocumentId)
        : null,
      showLeafDocuments: isLeafCategory(categories, effectiveFilters.categoryId)
    };
  } catch (error) {
    const emptyCompliance = calculateComplianceStatus({
      categories: [],
      rules: [],
      documents: [],
      fromFiscalPeriod: "2026-01",
      toFiscalPeriod: "2026-01",
      today: "2026-08-28"
    });

    return {
      alerts: getDashboardAlerts({ documents: [], compliance: emptyCompliance }),
      categories: [],
      categorySpend: getCategorySpend([], []),
      compliance: emptyCompliance,
      dataNotice:
        error instanceof Error
          ? error.message
          : "No se pudieron cargar los datos operativos.",
      documents: [],
      fiscalPeriods: buildAvailableFiscalPeriods([], new Date("2026-08-28")),
      fiscalPeriodSeries: [],
      filters,
      monthlySeries: [],
      reviewDocument: null,
      showLeafDocuments: false
    };
  }
}

function getFirstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}

function getDashboardTab(
  value: string | string[] | undefined
): "estadisticas" | "faltantes" {
  return getFirstValue(value) === "faltantes" ? "faltantes" : "estadisticas";
}

function buildDashboardTabHref(
  searchParams: Record<string, string | string[] | undefined>,
  tab: "estadisticas" | "faltantes"
): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    const firstValue = getFirstValue(value);

    if (!firstValue || key === "reviewDocumentId" || key === "tab") {
      continue;
    }

    params.set(key, firstValue);
  }

  if (tab === "faltantes") {
    params.set("tab", tab);
  }

  const query = params.toString();
  return query ? `/?${query}` : "/";
}

function getDashboardTabQueryParams(
  tab: "estadisticas" | "faltantes"
): Record<string, string | null | undefined> {
  return tab === "faltantes" ? { tab } : {};
}

function isLeafCategory(
  categories: Awaited<ReturnType<typeof getFilteredComplianceData>>["categories"],
  categoryId: string | null
): boolean {
  if (!categoryId) {
    return false;
  }

  return !categories.some(
    (category) => category.parentId === categoryId && category.active
  );
}
