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

import type { MonthlySeriesItem } from "@/server/dashboard/get-monthly-series";

import styles from "./MonthlyPaymentCountChart.module.css";

export function MonthlyPaymentCountChart({
  series
}: {
  series: MonthlySeriesItem[];
}) {
  return (
    <section className={styles.panel}>
      <h2>Cantidad de pagos por mes</h2>
      {series.length ? (
        <div className={styles.chart}>
          <ResponsiveContainer height="100%" width="100%">
            <LineChart data={series} margin={{ bottom: 8, left: 6, right: 12, top: 12 }}>
              <CartesianGrid stroke="rgb(15 23 42 / 10%)" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="month"
                minTickGap={18}
                tickLine={false}
                tickMargin={10}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tickMargin={8}
                width={42}
              />
              <Tooltip content={<CountTooltip />} />
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
        <p className="muted">Sin pagos procesados para graficar.</p>
      )}
    </section>
  );
}

interface CountTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    value?: number;
  }>;
}

function CountTooltip({ active, label, payload }: CountTooltipProps) {
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
