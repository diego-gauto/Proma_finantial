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

import styles from "./MonthlyAmountChart.module.css";

export function MonthlyAmountChart({ series }: { series: MonthlySeriesItem[] }) {
  return (
    <section className={styles.panel}>
      <h2>Importe por mes de pago</h2>
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
                axisLine={false}
                tickFormatter={formatCompactAmount}
                tickLine={false}
                tickMargin={8}
                width={74}
              />
              <Tooltip content={<AmountTooltip />} />
              <Line
                activeDot={{ r: 6, strokeWidth: 2 }}
                dataKey="amount"
                dot={{ r: 3, strokeWidth: 2 }}
                name="Importe"
                stroke="#6d5bd0"
                strokeWidth={2.5}
                type="monotone"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <p className="muted">No hay importes procesados para graficar.</p>
      )}
    </section>
  );
}

interface AmountTooltipProps {
  active?: boolean;
  label?: string;
  payload?: Array<{
    value?: number;
  }>;
}

function AmountTooltip({ active, label, payload }: AmountTooltipProps) {
  const amount = payload?.[0]?.value;

  if (!active || amount === undefined) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      <span>{label}</span>
      <strong>{formatCurrency(amount)}</strong>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount);
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    maximumFractionDigits: 0
  }).format(amount);
}

function formatCompactAmount(amount: number): string {
  if (amount >= 1_000_000) {
    return `${formatAmount(amount / 1_000_000)}M`;
  }

  if (amount >= 1_000) {
    return `${formatAmount(amount / 1_000)}k`;
  }

  return formatAmount(amount);
}
