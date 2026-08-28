import type { FiscalPeriodKind, PaymentRuleCadence } from "@/db/types";

const cadenceMonths: Record<PaymentRuleCadence, number | null> = {
  monthly: 1,
  bimonthly: 2,
  quarterly: 3,
  four_monthly: 4,
  semiannual: 6,
  annual: 12,
  custom: null,
  no_pattern: null
};

export function getCadenceMonths(
  cadence: PaymentRuleCadence,
  customPeriodMonths: number | null
): number | null {
  if (cadence === "custom") {
    return customPeriodMonths && customPeriodMonths > 0
      ? customPeriodMonths
      : null;
  }

  return cadenceMonths[cadence];
}

export function fiscalPeriodToMonthIndex(
  fiscalPeriod: string,
  kind: FiscalPeriodKind
): number {
  const [yearText, monthText] = fiscalPeriod.split("-");
  const year = Number(yearText);
  const month = kind === "year" ? 1 : Number(monthText);

  return year * 12 + month - 1;
}

export function monthIndexToFiscalPeriod(
  monthIndex: number,
  kind: FiscalPeriodKind
): string {
  const year = Math.floor(monthIndex / 12);
  const month = (monthIndex % 12) + 1;

  if (kind === "year") {
    return String(year);
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

export function dateToMonthIndex(dateText: string): number {
  const [yearText, monthText] = dateText.split("-");
  return Number(yearText) * 12 + Number(monthText) - 1;
}

export function addDays(dateText: string, days: number): string {
  const date = new Date(`${dateText}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function compareDateText(a: string, b: string): number {
  return a.localeCompare(b);
}

export function getDueDate(
  fiscalPeriod: string,
  kind: FiscalPeriodKind,
  options: {
    paymentMonth: number | null;
    paymentDay: number | null;
    paymentYearOffset: number;
    paymentMonthOffset: number;
  }
): string {
  const baseMonthIndex = fiscalPeriodToMonthIndex(fiscalPeriod, kind);
  const baseYear = Math.floor(baseMonthIndex / 12);
  const monthIndex =
    kind === "year" && options.paymentMonth
      ? (baseYear + options.paymentYearOffset) * 12 + options.paymentMonth - 1
      : baseMonthIndex + options.paymentMonthOffset + options.paymentYearOffset * 12;
  const dueYear = Math.floor(monthIndex / 12);
  const dueMonth = (monthIndex % 12) + 1;
  const dueDay = options.paymentDay ?? 1;
  const maxDay = new Date(Date.UTC(dueYear, dueMonth, 0)).getUTCDate();
  const clampedDay = Math.min(dueDay, maxDay);

  return `${dueYear}-${String(dueMonth).padStart(2, "0")}-${String(
    clampedDay
  ).padStart(2, "0")}`;
}
