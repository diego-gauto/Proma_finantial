import type { DocumentRow } from "@/db/types";

export interface MonthlySeriesItem {
  month: string;
  amount: number;
  paymentCount: number;
}

interface MonthlySeriesOptions {
  fiscalYear?: string | null;
}

export function getMonthlySeries(
  documents: DocumentRow[],
  options: MonthlySeriesOptions = {}
): MonthlySeriesItem[] {
  const byMonth = new Map<string, { amount: number; paymentCount: number }>();

  for (const document of documents) {
    if (
      document.processingStatus !== "processed" ||
      !document.paymentDate ||
      !document.amount
    ) {
      continue;
    }

    const month = document.paymentDate.slice(0, 7);
    const current = byMonth.get(month) ?? { amount: 0, paymentCount: 0 };
    current.amount += Number(document.amount);
    current.paymentCount += 1;
    byMonth.set(month, current);
  }

  if (options.fiscalYear) {
    return Array.from({ length: 12 }, (_, index) => {
      const month = `${options.fiscalYear}-${String(index + 1).padStart(2, "0")}`;
      const total = byMonth.get(month);

      return {
        month,
        amount: total ? Math.round(total.amount * 100) / 100 : 0,
        paymentCount: total?.paymentCount ?? 0
      };
    });
  }

  return [...byMonth.entries()]
    .map(([month, total]) => ({
      month,
      amount: Math.round(total.amount * 100) / 100,
      paymentCount: total.paymentCount
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
