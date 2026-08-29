import { CategoryCloudFilter } from "@/components/dashboard/CategoryCloudFilter";
import { CategorySpendList } from "@/components/dashboard/CategorySpendList";
import { CategorySpendPie } from "@/components/dashboard/CategorySpendPie";
import { DuplicateDocumentsCard } from "@/components/dashboard/DuplicateDocumentsCard";
import { FiscalPeriodFilter } from "@/components/dashboard/FiscalPeriodFilter";
import { MissingDocumentsCard } from "@/components/dashboard/MissingDocumentsCard";
import { MonthlyAmountChart } from "@/components/dashboard/MonthlyAmountChart";
import { MonthlyPaymentCountChart } from "@/components/dashboard/MonthlyPaymentCountChart";
import { OverduePaymentsPanel } from "@/components/dashboard/OverduePaymentsPanel";
import { ReviewRequiredAlert } from "@/components/dashboard/ReviewRequiredAlert";
import { UpcomingPaymentsPanel } from "@/components/dashboard/UpcomingPaymentsPanel";
import { listCategoryNodes } from "@/db/categories.repository";
import { listDocuments } from "@/db/documents.repository";
import { listPaymentRules } from "@/db/payment-rules.repository";
import { getDescendantCategoryIds } from "@/server/categories/category-tree";
import { calculateComplianceStatus } from "@/server/compliance/calculate-status";
import { getOverduePayments } from "@/server/compliance/get-overdue-payments";
import { getUpcomingPayments } from "@/server/compliance/get-upcoming-payments";
import {
  buildAvailableFiscalPeriods,
  parseDashboardFilters
} from "@/server/dashboard/dashboard-filters";
import { getCategorySpend } from "@/server/dashboard/get-category-spend";
import { getDashboardAlerts } from "@/server/dashboard/get-dashboard-alerts";
import { getMonthlySeries } from "@/server/dashboard/get-monthly-series";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface HomePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const filters = parseDashboardFilters(await searchParams);
  const data = await getDashboardPageData(filters);

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
        <FiscalPeriodFilter filters={filters} periods={data.fiscalPeriods} />
        <CategoryCloudFilter categories={data.categories} filters={filters} />
      </section>

      <section className={styles.actionGrid}>
        <MissingDocumentsCard missing={data.compliance.missing} />
        <DuplicateDocumentsCard duplicates={data.compliance.duplicates} />
      </section>

      <section className={styles.analyticsGrid}>
        <div className="panel">
          <div className="panel-header">
            <h2>Gasto por categoria</h2>
          </div>
          <div className={`panel-body ${styles.spendPanel}`}>
            <CategorySpendPie spend={data.categorySpend} />
            <CategorySpendList spend={data.categorySpend} />
          </div>
        </div>
      </section>

      <section className={styles.monthlyGrid}>
        <MonthlyAmountChart series={data.monthlySeries} />
        <MonthlyPaymentCountChart series={data.monthlySeries} />
      </section>

      <section className={styles.statusGrid}>
        <OverduePaymentsPanel overdue={data.overdue} />
        <UpcomingPaymentsPanel upcoming={data.upcoming} />
      </section>
    </div>
  );
}

type DashboardFilters = ReturnType<typeof parseDashboardFilters>;

async function getDashboardPageData(filters: DashboardFilters) {
  try {
    const categories = await listCategoryNodes();
    const categoryIds = filters.categoryId
      ? getDescendantCategoryIds(categories, filters.categoryId)
      : undefined;
    const documents = await listDocuments({
      filters: {
        categoryIds,
        fiscalPeriod: filters.fiscalPeriod ?? undefined
      },
      limit: 500
    });
    const periodSourceDocuments = filters.fiscalPeriod
      ? await listDocuments({
          filters: {
            categoryIds
          },
          limit: 500
        })
      : documents;
    const rules = await listPaymentRules();
    const [fromFiscalPeriod, toFiscalPeriod] = getFiscalPeriodRange(
      filters.fiscalPeriod
    );
    const compliance = calculateComplianceStatus({
      categories,
      rules,
      documents,
      fromFiscalPeriod,
      toFiscalPeriod,
      today: new Date().toISOString().slice(0, 10)
    });

    return {
      alerts: getDashboardAlerts({ documents, compliance }),
      categories,
      categorySpend: getCategorySpend(categories, documents, {
        selectedCategoryId: filters.categoryId
      }),
      compliance,
      dataNotice: null,
      fiscalPeriods: buildAvailableFiscalPeriods(periodSourceDocuments),
      monthlySeries: getMonthlySeries(documents, {
        fiscalYear:
          filters.fiscalPeriod && !filters.fiscalPeriod.includes("-")
            ? filters.fiscalPeriod
            : null
      }),
      overdue: getOverduePayments(compliance),
      upcoming: getUpcomingPayments(compliance)
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
      fiscalPeriods: buildAvailableFiscalPeriods([], new Date("2026-08-28")),
      monthlySeries: [],
      overdue: [],
      upcoming: []
    };
  }
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
