import type { CategorySpend } from "@/server/dashboard/get-category-spend";
import { formatMoney } from "@/shared/format";

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
  spend: CategorySpend
): CompactSpendLegendItem[] {
  return spend.items.map((item, index) => ({
    amountLabel: formatMoney(item.amount),
    categoryId: item.categoryId,
    categoryName: item.categoryName,
    color: getCategoryColor(index),
    paymentCountLabel: `${item.paymentCount} ${
      item.paymentCount === 1 ? "pago" : "pagos"
    }`,
    percentageLabel: `${item.percentage.toFixed(2)}%`
  }));
}

export function formatSpendCurrency(amount: number): string {
  return formatMoney(amount);
}
