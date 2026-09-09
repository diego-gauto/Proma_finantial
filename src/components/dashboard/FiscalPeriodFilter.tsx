"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  buildDashboardQuery,
  getFiscalPeriodStage,
  shouldRevealFiscalMonths,
  type DashboardFilters
} from "@/server/dashboard/dashboard-filters";

import styles from "./FiscalPeriodFilter.module.css";

const yearTransition = {
  duration: 0.68,
  ease: [0.16, 1, 0.3, 1]
} as const;

export function FiscalPeriodFilter({
  filters,
  queryParams,
  pathname = "/",
  periods
}: {
  filters: DashboardFilters;
  pathname?: string;
  queryParams?: Record<string, string | null | undefined>;
  periods: string[];
}) {
  return (
    <FiscalPeriodFilterSurface
      filters={filters}
      pathname={pathname}
      queryParams={queryParams}
      periods={periods}
    />
  );
}

function FiscalPeriodFilterSurface({
  filters,
  pathname,
  queryParams = {},
  periods
}: {
  filters: DashboardFilters;
  pathname: string;
  queryParams?: Record<string, string | null | undefined>;
  periods: string[];
}) {
  const router = useRouter();
  const initialStage = useMemo(
    () => getFiscalPeriodStage(periods, filters.fiscalPeriod),
    [periods, filters.fiscalPeriod]
  );
  const visibleMonthsOpen = shouldRevealFiscalMonths();
  const stage = initialStage;
  const selectedMonth = filters.fiscalPeriod?.includes("-")
    ? filters.fiscalPeriod
    : null;
  const selectedYear = filters.fiscalPeriod?.slice(0, 4) ?? stage.selectedYear;
  const years = [
    ...stage.sideYears.filter((year) => year < stage.selectedYear),
    stage.selectedYear,
    ...stage.sideYears.filter((year) => year > stage.selectedYear)
  ];

  const goToPeriod = (fiscalPeriod: string | null) => {
    router.push(
      buildDashboardQuery({ ...filters, fiscalPeriod }, pathname, queryParams)
    );
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
        <div className={styles.yearRail}>
          {years.map((year) => (
            <YearButton
              isSelected={selectedYear === year}
              key={year}
              onClick={() => goToPeriod(year)}
              year={year}
            />
          ))}
        </div>

        <div className={styles.monthStack}>
          {visibleMonthsOpen ? (
            <div
              aria-label="Meses fiscales disponibles"
              className={styles.monthRail}
            >
              {stage.visibleMonths.map((period) => (
                <motion.button
                  className={[
                    styles.monthChip,
                    selectedMonth === period ? styles.monthChipSelected : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  key={period}
                  onClick={() => goToPeriod(period)}
                  type="button"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                >
                  {period}
                </motion.button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function YearButton({
  isSelected,
  onClick,
  year
}: {
  isSelected: boolean;
  onClick: () => void;
  year: string;
}) {
  return (
    <motion.button
      className={[
        styles.yearChip,
        isSelected ? styles.yearChipSelected : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      transition={yearTransition}
      type="button"
      whileHover={{ scale: 1.06, y: -2 }}
      whileTap={{ scale: 0.96 }}
    >
      {year}
    </motion.button>
  );
}
