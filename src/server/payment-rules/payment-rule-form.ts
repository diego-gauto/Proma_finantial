import { z } from "zod";

import type { FiscalPeriodKind } from "@/db/types";

export interface PaymentRuleInput {
  activeFrom: string;
  activeTo: string | null;
  appliesToDescendants: boolean;
  categoryNodeId: string;
  customPeriodMonths: number | null;
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

const schema = z.object({
  activeFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activeTo: z.string().optional(),
  appliesToDescendants: z.string().optional(),
  categoryNodeId: z.string().trim().min(1),
  customPeriodMonths: z.string().optional(),
  fiscalPeriodKind: z.enum(["month", "year", "unknown"]),
  graceDays: z.string().optional(),
  intervalMonths: z.string().optional(),
  name: z.string().trim().min(1),
  notes: z.string().optional(),
  paymentDay: z.string().optional(),
  paymentMonth: z.string().optional(),
  paymentMonthOffset: z.string().optional(),
  paymentYearOffset: z.string().optional(),
  reminderDaysBefore: z.string().optional()
});

export function parsePaymentRuleForm(
  raw: Record<string, FormDataEntryValue | string | undefined>
): PaymentRuleInput {
  const parsed = schema.parse(raw);
  const paymentDay = parseOptionalNumber(parsed.paymentDay);
  const paymentMonth = parseOptionalNumber(parsed.paymentMonth);

  if (paymentDay !== null && (paymentDay < 1 || paymentDay > 31)) {
    throw new Error("Dia de pago invalido.");
  }

  if (paymentMonth !== null && (paymentMonth < 1 || paymentMonth > 12)) {
    throw new Error("Mes de pago invalido.");
  }

  return {
    activeFrom: parsed.activeFrom,
    activeTo: normalizeText(parsed.activeTo),
    appliesToDescendants: parsed.appliesToDescendants === "on",
    categoryNodeId: parsed.categoryNodeId,
    customPeriodMonths: parseOptionalNumber(parsed.customPeriodMonths),
    fiscalPeriodKind: parsed.fiscalPeriodKind,
    graceDays: parseNumber(parsed.graceDays, 0),
    intervalMonths: parseOptionalNumber(parsed.intervalMonths),
    name: parsed.name,
    notes: normalizeText(parsed.notes),
    paymentDay,
    paymentMonth,
    paymentMonthOffset: parseNumber(parsed.paymentMonthOffset, 0),
    paymentYearOffset: parseNumber(parsed.paymentYearOffset, 0),
    reminderDaysBefore: parseNumber(parsed.reminderDaysBefore, 0)
  };
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
