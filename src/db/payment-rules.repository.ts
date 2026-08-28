import { getDbPool } from "@/db/client";
import type { PaymentRuleRow } from "@/db/types";

interface PaymentRuleDbRow {
  id: string;
  category_node_id: string;
  applies_to_descendants: boolean;
  name: string;
  cadence: PaymentRuleRow["cadence"];
  custom_period_months: number | null;
  anchor_period_month: number | null;
  fiscal_period_kind: PaymentRuleRow["fiscalPeriodKind"];
  payment_month: number | null;
  payment_day: number | null;
  payment_year_offset: number;
  payment_month_offset: number;
  active_from: string;
  active_to: string | null;
  grace_days: number;
  reminder_days_before: number;
  active: boolean;
  notes: string | null;
}

function toPaymentRule(row: PaymentRuleDbRow): PaymentRuleRow {
  return {
    id: row.id,
    categoryNodeId: row.category_node_id,
    appliesToDescendants: row.applies_to_descendants,
    name: row.name,
    cadence: row.cadence,
    customPeriodMonths: row.custom_period_months,
    anchorPeriodMonth: row.anchor_period_month,
    fiscalPeriodKind: row.fiscal_period_kind,
    paymentMonth: row.payment_month,
    paymentDay: row.payment_day,
    paymentYearOffset: row.payment_year_offset,
    paymentMonthOffset: row.payment_month_offset,
    activeFrom: row.active_from,
    activeTo: row.active_to,
    graceDays: row.grace_days,
    reminderDaysBefore: row.reminder_days_before,
    active: row.active,
    notes: row.notes
  };
}

export async function listPaymentRules(): Promise<PaymentRuleRow[]> {
  const result = await getDbPool().query<PaymentRuleDbRow>(
    `
      select
        id,
        category_node_id,
        applies_to_descendants,
        name,
        cadence,
        custom_period_months,
        anchor_period_month,
        fiscal_period_kind,
        active_from::text,
        active_to::text,
        payment_month,
        payment_day,
        payment_year_offset,
        payment_month_offset,
        grace_days,
        reminder_days_before,
        active,
        notes
      from payment_rules
      order by category_node_id asc, active_from desc
    `
  );

  return result.rows.map(toPaymentRule);
}
