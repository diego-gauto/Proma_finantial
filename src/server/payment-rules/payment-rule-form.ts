import { z } from "zod";

import type { FiscalPeriodKind } from "@/db/types";

export interface PaymentRuleInput {
  activeFrom: string;
  activeTo: string | null;
  anchorPeriodMonth: number | null;
  appliesToDescendants: boolean;
  categoryNodeId: string;
  customPeriodMonths: number[] | null;
  fiscalPeriodKind: FiscalPeriodKind;
  graceDays: number;
  intervalMonths: number | null;
  name: string;
  notes: string | null;
  paymentDay: number | null;
  paymentMonth: number | null;
  paymentMonthOffset: number;
  paymentYearOffset: number;
  reminderDaysBefore: number;
}

const fixedPeriodicityToInterval = {
  annual: 12,
  bimonthly: 2,
  four_monthly: 4,
  monthly: 1,
  quarterly: 3,
  semiannual: 6
} as const;

const schema = z.object({
  activeFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  activeFromMonth: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  activeTo: z.string().optional(),
  appliesToDescendants: z.string().optional(),
  annualPaymentMonth: z.string().optional(),
  anchorPeriodMonth: z.string().optional(),
  bimonthlyParity: z.enum(["even", "odd"]).optional(),
  categoryNodeId: z.string().trim().min(1),
  customPeriodMonths: z.string().optional(),
  fiscalPeriodKind: z.enum(["month", "year", "unknown"]).optional(),
  graceDays: z.string().optional(),
  intervalMonths: z.string().optional(),
  name: z.string().trim().min(1),
  notes: z.string().optional(),
  monthsAfterPeriodEnd: z.string().optional(),
  paymentDay: z.string().optional(),
  paymentMonth: z.string().optional(),
  paymentMonthWithinPeriod: z.string().optional(),
  paymentMonthOffset: z.string().optional(),
  paymentTiming: z
    .enum([
      "same_month",
      "next_month",
      "fixed_month_next_year",
      "within_period",
      "after_period_end"
    ])
    .optional(),
  periodicity: z
    .enum([
      "monthly",
      "bimonthly",
      "quarterly",
      "four_monthly",
      "semiannual",
      "annual",
      "custom",
      "no_pattern"
    ])
    .optional(),
  paymentYearOffset: z.string().optional(),
  reminderDaysBefore: z.string().optional()
});

export function parsePaymentRuleForm(
  raw: Record<string, FormDataEntryValue | string | undefined>
): PaymentRuleInput {
  const parsed = schema.parse(raw);
  const periodicity = parsed.periodicity;
  const intervalMonths =
    periodicity && periodicity in fixedPeriodicityToInterval
      ? fixedPeriodicityToInterval[
          periodicity as keyof typeof fixedPeriodicityToInterval
        ]
      : periodicity
        ? null
        : parseOptionalNumber(parsed.intervalMonths);
  const paymentDay = parseOptionalNumber(parsed.paymentDay);
  const activeFrom = parsed.activeFromMonth
    ? `${parsed.activeFromMonth}-01`
    : parsed.activeFrom;

  if (!activeFrom) {
    throw new Error("Falta el mes de inicio de vigencia.");
  }

  const fiscalPeriodKind =
    parsed.fiscalPeriodKind && parsed.fiscalPeriodKind !== "unknown"
      ? parsed.fiscalPeriodKind
      : "month";
  const customPeriodMonths =
    periodicity === "custom"
      ? parseOptionalNumberList(parsed.customPeriodMonths)
      : intervalMonths
        ? null
        : parseOptionalNumberList(parsed.customPeriodMonths);
  const paymentTiming = parsed.paymentTiming ?? "same_month";
  const anchorPeriodMonth = getAnchorPeriodMonth(
    parsed,
    intervalMonths,
    paymentTiming
  );
  const paymentMonth =
    paymentTiming === "fixed_month_next_year"
      ? parseOptionalNumber(parsed.annualPaymentMonth) ??
        parseOptionalNumber(parsed.paymentMonth)
      : parseOptionalNumber(parsed.paymentMonth);
  const paymentMonthOffset = getPaymentMonthOffset(parsed, paymentTiming);
  const paymentYearOffset =
    paymentTiming === "fixed_month_next_year"
      ? 1
      : parseNumber(parsed.paymentYearOffset, 0);

  if (paymentDay !== null && (paymentDay < 1 || paymentDay > 31)) {
    throw new Error("Dia de pago invalido.");
  }

  if (paymentMonth !== null && (paymentMonth < 1 || paymentMonth > 12)) {
    throw new Error("Mes de pago invalido.");
  }

  return {
    activeFrom,
    activeTo: normalizeText(parsed.activeTo),
    anchorPeriodMonth,
    appliesToDescendants: parsed.appliesToDescendants === "on",
    categoryNodeId: parsed.categoryNodeId,
    customPeriodMonths,
    fiscalPeriodKind,
    graceDays: parseNumber(parsed.graceDays, 0),
    intervalMonths,
    name: parsed.name,
    notes: normalizeText(parsed.notes),
    paymentDay,
    paymentMonth,
    paymentMonthOffset,
    paymentYearOffset,
    reminderDaysBefore: parseNumber(parsed.reminderDaysBefore, 0)
  };
}

function getAnchorPeriodMonth(
  parsed: z.infer<typeof schema>,
  intervalMonths: number | null,
  paymentTiming: z.infer<typeof schema>["paymentTiming"]
): number | null {
  if (!intervalMonths) {
    return null;
  }

  if (paymentTiming === "after_period_end") {
    return intervalMonths;
  }

  if (paymentTiming === "within_period") {
    return parsePeriodMonth(parsed.paymentMonthWithinPeriod, intervalMonths);
  }

  if (intervalMonths === 2 && parsed.bimonthlyParity) {
    return parsed.bimonthlyParity === "even" ? 2 : 1;
  }

  return parseOptionalNumber(parsed.anchorPeriodMonth) ?? 1;
}

function getPaymentMonthOffset(
  parsed: z.infer<typeof schema>,
  paymentTiming: z.infer<typeof schema>["paymentTiming"]
): number {
  if (paymentTiming === "next_month") {
    return 1;
  }

  if (paymentTiming === "fixed_month_next_year" || paymentTiming === "within_period") {
    return 0;
  }

  if (paymentTiming === "after_period_end") {
    return parseNumber(parsed.monthsAfterPeriodEnd, 1);
  }

  return parseNumber(parsed.paymentMonthOffset, 0);
}

function parsePeriodMonth(value: string | undefined, intervalMonths: number): number {
  const month = parseNumber(value, 1);

  if (!Number.isInteger(month) || month < 1 || month > intervalMonths) {
    throw new Error("Mes dentro del periodo invalido.");
  }

  return month;
}

function normalizeText(value: string | undefined): string | null {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseNumber(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseOptionalNumber(value: string | undefined): number | null {
  const normalized = normalizeText(value);
  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseOptionalNumberList(value: string | undefined): number[] | null {
  const normalized = normalizeText(value);

  if (!normalized) {
    return null;
  }

  const numbers = normalized
    .split(",")
    .map((item) => Number(item.trim()));

  if (
    numbers.some(
      (month) => !Number.isInteger(month) || month < 1 || month > 12
    )
  ) {
    throw new Error("Meses custom invalidos.");
  }

  return numbers.length ? numbers : null;
}
