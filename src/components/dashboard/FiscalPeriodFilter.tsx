"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  buildDashboardQuery,
  getFiscalPeriodStage,
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
  const router = useRouter();
  const [travellingPeriod, setTravellingPeriod] = useState<string | null>(null);
  const stage = getFiscalPeriodStage(periods, filters.fiscalPeriod);
  const selectedMonth = filters.fiscalPeriod?.includes("-")
    ? filters.fiscalPeriod
    : null;

  const goToPeriod = (fiscalPeriod: string | null) => {
    setTravellingPeriod(fiscalPeriod ?? "all");
    window.setTimeout(() => {
      router.push(buildDashboardQuery({ ...filters, fiscalPeriod }));
    }, 320);
  };

  return (
    <section className={styles.panel} aria-label="Filtro por periodo fiscal">
      <div className={styles.heading}>
        <h2>Periodo fiscal</h2>
        <button
          className={styles.reset}
          onClick={() => goToPeriod(null)}
          type="button"
        >
          Todos
        </button>
      </div>

      <div className={styles.stage}>
        <div className={styles.sideYears}>
          {stage.sideYears.map((year) => (
            <button
              className={[
                styles.yearChip,
                travellingPeriod === year ? styles.yearChipTravelling : ""
              ]
                .filter(Boolean)
                .join(" ")}
              key={year}
              onClick={() => goToPeriod(year)}
              type="button"
            >
              {year}
            </button>
          ))}
        </div>

        <button
          className={[
            styles.centerYear,
            travellingPeriod ? styles.centerYearTravelling : ""
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => goToPeriod(stage.selectedYear)}
          type="button"
        >
          <strong>{stage.selectedYear}</strong>
          <span>
            {selectedMonth
              ? `Periodo ${selectedMonth}`
              : "Anio operativo activo"}
          </span>
        </button>
      </div>

      <div className={styles.monthRail} aria-label="Meses fiscales disponibles">
        {stage.visibleMonths.map((period, index) => (
          <button
            className={[
              styles.monthChip,
              selectedMonth === period ? styles.monthChipSelected : "",
              travellingPeriod === period ? styles.monthChipTravelling : ""
            ]
              .filter(Boolean)
              .join(" ")}
            key={period}
            onClick={() => goToPeriod(period)}
            style={{ animationDelay: `${index * 28}ms` }}
            type="button"
          >
            {period}
          </button>
        ))}
      </div>
    </section>
  );
}
