import type { DocumentRow } from "@/db/types";

export interface FiscalPeriodSeriesItem {
  fiscalPeriod: string;
  amount: number;
  paymentCount: number;
}

interface FiscalPeriodSeriesOptions {
  fiscalYear?: string | null;
}

export function getFiscalPeriodSeries(
  documents: DocumentRow[],
  options: FiscalPeriodSeriesOptions = {}
): FiscalPeriodSeriesItem[] {
  const byFiscalPeriod = new Map<
    string,
    { amount: number; paymentCount: number }
  >();

  for (const document of documents) {
    if (
      document.processingStatus !== "processed" ||
      !document.fiscalPeriod ||
      !document.amount
    ) {
      continue;
    }

    for (const fiscalPeriod of getCoveredFiscalPeriods(document)) {
      const current = byFiscalPeriod.get(fiscalPeriod) ?? {
        amount: 0,
        paymentCount: 0
      };
      current.amount += Number(document.amount);
      current.paymentCount += 1;
      byFiscalPeriod.set(fiscalPeriod, current);
    }
  }

  if (options.fiscalYear) {
    return Array.from({ length: 12 }, (_, index) => {
      const fiscalPeriod = `${options.fiscalYear}-${String(index + 1).padStart(2, "0")}`;
      const total = byFiscalPeriod.get(fiscalPeriod);

      return {
        fiscalPeriod,
        amount: total ? Math.round(total.amount * 100) / 100 : 0,
        paymentCount: total?.paymentCount ?? 0
      };
    });
  }

  return [...byFiscalPeriod.entries()]
    .map(([fiscalPeriod, total]) => ({
      fiscalPeriod,
      amount: Math.round(total.amount * 100) / 100,
      paymentCount: total.paymentCount
    }))
    .sort((a, b) => a.fiscalPeriod.localeCompare(b.fiscalPeriod));
}

function getCoveredFiscalPeriods(document: DocumentRow): string[] {
  if (
    document.fiscalPeriodKind !== "month" ||
    !document.fiscalPeriod?.includes("-")
  ) {
    return document.fiscalPeriod ? [document.fiscalPeriod] : [];
  }

  const year = document.fiscalPeriod.slice(0, 4);
  const months = document.coveredFiscalMonths?.length
    ? document.coveredFiscalMonths
    : [Number(document.fiscalPeriod.slice(5, 7))];

  return [...new Set(months)]
    .filter((month) => Number.isInteger(month) && month >= 1 && month <= 12)
    .sort((a, b) => a - b)
    .map((month) => `${year}-${String(month).padStart(2, "0")}`);
}
