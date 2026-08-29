import { Button } from "@/components/ui/Button";
import {
  buildDashboardQuery,
  type DashboardFilters
} from "@/server/dashboard/dashboard-filters";

import styles from "./FiscalPeriodFilter.module.css";

export function FiscalPeriodFilter({
  filters,
  periods
}: {
  filters: DashboardFilters;
  periods: string[];
}) {
  return (
    <section className={styles.panel} aria-label="Filtro por periodo fiscal">
      <h2>Periodo fiscal</h2>
      <div className={styles.chipRow}>
        <Button
          href={buildDashboardQuery({ ...filters, fiscalPeriod: null })}
          variant={!filters.fiscalPeriod ? "primary" : "secondary"}
        >
          Todos
        </Button>
        {periods.map((period) => (
          <Button
            href={buildDashboardQuery({ ...filters, fiscalPeriod: period })}
            key={period}
            variant={filters.fiscalPeriod === period ? "primary" : "secondary"}
          >
            {period}
          </Button>
        ))}
      </div>
    </section>
  );
}
