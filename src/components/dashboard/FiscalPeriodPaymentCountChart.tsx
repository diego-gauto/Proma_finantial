"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import type { FiscalPeriodSeriesItem } from "@/server/dashboard/get-fiscal-period-series";

import styles from "./FiscalPeriodPaymentCountChart.module.css";

export function FiscalPeriodPaymentCountChart({
  series
}: {
  series: FiscalPeriodSeriesItem[];
}) {
  return (
    <section className={styles.panel}>
      <h2>Cantidad de pagos por periodo fiscal</h2>
      {series.length ? (
        <div className={styles.chart}>
          <ResponsiveContainer height="100%" width="100%">
            <LineChart
              data={series}
              margin={{ bottom: 8, left: 6, right: 12, top: 12 }}
            >
              <CartesianGrid stroke="rgb(168 179 199 / 18%)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="fiscalPeriod"
                minTickGap={18}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                tickLine={false}
                tickMargin={8}
                width={42}
              />
              <Tooltip content={<FiscalPeriodTooltip />} />
              <Line
                activeDot={{ r: 6, strokeWidth: 2 }}
                dataKey="paymentCount"
                dot={{ r: 3, strokeWidth: 2 }}
                name="Pagos"
                stroke="#008a7a"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="muted">No hay pagos procesados por periodo fiscal.</p>
      )}
    </section>
  );
}

interface FiscalPeriodTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    payload?: FiscalPeriodSeriesItem;
    value?: number;
  }>;
}

function FiscalPeriodTooltip({
  active,
  label,
  payload
}: FiscalPeriodTooltipProps) {
  const paymentCount = payload?.[0]?.value;

  if (!active || paymentCount === undefined) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      <span>{label}</span>
      <strong>{paymentCount} pagos</strong>
    </div>
  );
}
