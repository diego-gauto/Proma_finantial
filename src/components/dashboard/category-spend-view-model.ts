import type { CategorySpend } from "@/server/dashboard/get-category-spend";

import { getCategoryColor } from "./chart-colors";

export interface CompactSpendLegendItem {
  amountLabel: string;
  categoryId: string;
  categoryName: string;
  color: string;
  paymentCountLabel: string;
  percentageLabel: string;
}

export function buildCompactSpendLegend(
  spend: CategorySpend,
  limit = 6
): CompactSpendLegendItem[] {
  return spend.items.slice(0, limit).map((item, index) => ({
    amountLabel: formatCurrency(item.amount),
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    color: getCategoryColor(index),
    paymentCountLabel: `${item.paymentCount} ${
      item.paymentCount === 1 ? "pago" : "pagos"
    }`,
    percentageLabel: `${item.percentage}%`
  }));
}

export function formatSpendCurrency(amount: number): string {
  return formatCurrency(amount);
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-AR", {
    currency: "ARS",
    maximumFractionDigits: 0,
    style: "currency"
  }).format(amount).replace("\u00a0", " ");
}
