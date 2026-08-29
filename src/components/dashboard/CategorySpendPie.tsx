"use client";

import { useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip
} from "recharts";

import type { CategorySpend } from "@/server/dashboard/get-category-spend";

import {
  buildCompactSpendLegend,
  formatSpendCurrency
} from "./category-spend-view-model";
import { getCategoryColor } from "./chart-colors";
import styles from "./CategorySpendPie.module.css";

export function CategorySpendPie({ spend }: { spend: CategorySpend }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  if (!spend.items.length) {
    return <div className={styles.empty}>Sin gastos procesados</div>;
  }

  const activeItem =
    activeIndex === null ? null : spend.items[activeIndex] ?? null;
  const centerAmount = activeItem?.amount ?? spend.totalAmount;
  const legendItems = buildCompactSpendLegend(spend);

  return (
    <div className={styles.shell} onMouseLeave={() => setActiveIndex(null)}>
      <div
        aria-label={`Total gastado ${formatCurrency(spend.totalAmount)}`}
        className={styles.chart}
      >
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              cx="50%"
              cy="50%"
              data={spend.items}
              dataKey="amount"
              innerRadius="55%"
              nameKey="categoryName"
              onMouseEnter={(_, index) => setActiveIndex(index)}
              outerRadius="88%"
              paddingAngle={0}
              stroke="var(--background)"
              strokeWidth={2}
            >
              {spend.items.map((item, index) => (
                <Cell
                  fill={getCategoryColor(index)}
                  key={item.categoryId}
                  opacity={
                    activeIndex === null || activeIndex === index ? 1 : 0.12
                  }
                  stroke={
                    activeIndex === index
                      ? "var(--text)"
                      : "var(--background)"
                  }
                  strokeWidth={activeIndex === index ? 4 : 2}
                />
              ))}
            </Pie>
            <Tooltip content={<SpendTooltip totalAmount={spend.totalAmount} />} />
          </PieChart>
        </ResponsiveContainer>

        <div className={styles.center}>
          <strong>{formatCurrency(centerAmount)}</strong>
          <span>{activeItem?.categoryName ?? "Total"}</span>
        </div>
      </div>

      <ol className={styles.legend} aria-label="Categorias del grafico">
        {legendItems.map((item, index) => (
          <li
            className={[
              activeIndex !== null && activeIndex !== index
                ? styles.legendDimmed
                : "",
              activeIndex === index ? styles.legendActive : ""
            ]
              .filter(Boolean)
              .join(" ")}
            key={item.categoryId}
            onMouseEnter={() => setActiveIndex(index)}
          >
            <span
              aria-hidden="true"
              className={styles.swatch}
              style={{ backgroundColor: item.color }}
            />
            <span className={styles.legendName}>{item.categoryName}</span>
            <strong>{item.amountLabel}</strong>
            <span>{item.percentageLabel}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

interface SpendTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload?: {
      categoryName: string;
      amount: number;
      percentage: number;
      paymentCount: number;
    };
  }>;
  totalAmount: number;
}

function SpendTooltip({ active, payload, totalAmount }: SpendTooltipProps) {
  const item = payload?.[0]?.payload;

  if (!active || !item) {
    return null;
  }

  return (
    <div className={styles.tooltip}>
      <span>{item.categoryName}</span>
      <strong>{formatCurrency(item.amount)}</strong>
      <small>
        {item.percentage}% de {formatCurrency(totalAmount)} ·{" "}
        {item.paymentCount} pagos
      </small>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return formatSpendCurrency(amount);
}
