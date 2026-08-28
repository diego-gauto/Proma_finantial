import { Button } from "@/components/ui/Button";
import {
  buildDashboardQuery,
  type DashboardFilters
} from "@/server/dashboard/dashboard-filters";

const quickPeriods = ["2026", "2026-01", "2026-02", "2026-03"];

export function FiscalPeriodFilter({ filters }: { filters: DashboardFilters }) {
  return (
    <section className="filter-block" aria-label="Filtro por periodo fiscal">
      <h2>Periodo fiscal</h2>
      <div className="chip-row">
        <Button
          href={buildDashboardQuery({ ...filters, fiscalPeriod: null })}
          variant={!filters.fiscalPeriod ? "primary" : "secondary"}
        >
          Todos
        </Button>
        {quickPeriods.map((period) => (
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
