"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

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
  periods
}: {
  filters: DashboardFilters;
  periods: string[];
}) {
  return (
    <FiscalPeriodFilterSurface
      filters={filters}
      key={`${filters.fiscalPeriod ?? "all"}:${periods.join("|")}`}
      periods={periods}
    />
  );
}

function FiscalPeriodFilterSurface({
  filters,
  periods
}: {
  filters: DashboardFilters;
  periods: string[];
}) {
  const router = useRouter();
  const initialStage = useMemo(
    () => getFiscalPeriodStage(periods, filters.fiscalPeriod),
    [periods, filters.fiscalPeriod]
  );
  const [displayYear, setDisplayYear] = useState(initialStage.selectedYear);
  const [monthsOpen, setMonthsOpen] = useState(
    shouldRevealFiscalMonths(filters.fiscalPeriod)
  );
  const [pendingPeriod, setPendingPeriod] = useState<string | null>(null);
  const stage = getFiscalPeriodStage(periods, displayYear);
  const selectedMonth = filters.fiscalPeriod?.includes("-")
    ? filters.fiscalPeriod
    : null;
  const sideYears = stage.sideYears;
  const leftYears = sideYears.filter((_, index) => index % 2 === 0);
  const rightYears = sideYears.filter((_, index) => index % 2 === 1);
  const hasSideYears = sideYears.length > 0;

  const goToPeriod = (fiscalPeriod: string | null) => {
    setPendingPeriod(fiscalPeriod);

    if (!fiscalPeriod) {
      setMonthsOpen(false);
      window.setTimeout(() => {
        router.push(buildDashboardQuery({ ...filters, fiscalPeriod: null }));
      }, 260);
      return;
    }

    const nextYear = fiscalPeriod.slice(0, 4);
    const isYearChange = nextYear !== displayYear;

    if (isYearChange) {
      setMonthsOpen(false);
      window.setTimeout(() => {
        setDisplayYear(nextYear);
      }, 240);
      window.setTimeout(() => {
        setMonthsOpen(true);
      }, 620);
    } else {
      setMonthsOpen(true);
    }

    window.setTimeout(() => {
      router.push(buildDashboardQuery({ ...filters, fiscalPeriod }));
    }, isYearChange ? 860 : 280);
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

      <LayoutGroup id="fiscal-period-stage">
        <div
          className={[
            styles.stage,
            !hasSideYears ? styles.stageCentered : ""
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <motion.div className={styles.sideYears} layout>
            {leftYears.map((year) => (
              <YearButton
                isPending={pendingPeriod === year}
                key={year}
                onClick={() => goToPeriod(year)}
                year={year}
              />
            ))}
          </motion.div>

          <div className={styles.centerStack}>
            <motion.button
              className={[
                styles.centerYear,
                pendingPeriod ? styles.centerYearPending : ""
              ]
                .filter(Boolean)
                .join(" ")}
              layout
              layoutId={`year-${stage.selectedYear}`}
              onClick={() => goToPeriod(stage.selectedYear)}
              transition={yearTransition}
              type="button"
            >
              <strong>{stage.selectedYear}</strong>
              <span>
                {selectedMonth
                  ? `Periodo ${selectedMonth}`
                  : monthsOpen
                    ? "Meses fiscales disponibles"
                    : "Abrir meses fiscales"}
              </span>
            </motion.button>

            <AnimatePresence mode="wait">
              {monthsOpen ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.monthRail}
                  exit={{ opacity: 0, y: -10, filter: "blur(8px)" }}
                  initial={{ opacity: 0, y: -16 }}
                  key={stage.selectedYear}
                  transition={{ duration: 0.34, ease: [0.16, 1, 0.3, 1] }}
                  aria-label="Meses fiscales disponibles"
                >
                  {stage.visibleMonths.map((period, index) => (
                    <motion.button
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={[
                        styles.monthChip,
                        selectedMonth === period ? styles.monthChipSelected : "",
                        pendingPeriod === period ? styles.monthChipPending : ""
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      exit={{ opacity: 0, y: -8, scale: 0.92 }}
                      initial={{ opacity: 0, y: -12, scale: 0.92 }}
                      key={period}
                      onClick={() => goToPeriod(period)}
                      transition={{
                        duration: 0.36,
                        delay: index * 0.035,
                        ease: [0.16, 1, 0.3, 1]
                      }}
                      type="button"
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {period}
                    </motion.button>
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <motion.div className={styles.sideYears} layout>
            {rightYears.map((year) => (
              <YearButton
                isPending={pendingPeriod === year}
                key={year}
                onClick={() => goToPeriod(year)}
                year={year}
              />
            ))}
          </motion.div>
        </div>
      </LayoutGroup>
    </section>
  );
}

function YearButton({
  isPending,
  onClick,
  year
}: {
  isPending: boolean;
  onClick: () => void;
  year: string;
}) {
  return (
    <motion.button
      className={[styles.yearChip, isPending ? styles.yearChipPending : ""]
        .filter(Boolean)
        .join(" ")}
      layout
      layoutId={`year-${year}`}
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
