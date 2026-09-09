import Link from "next/link";

import type { PaymentRuleRow } from "@/db/types";

import { sortRulesForHistory } from "./payment-rule-presenter";
import styles from "./PaymentRuleHistory.module.css";

interface PaymentRuleHistoryProps {
  categoryId: string;
  rules: PaymentRuleRow[];
}

const cadenceLabels: Record<PaymentRuleRow["cadence"], string> = {
  annual: "Anual",
  bimonthly: "Bimestral",
  custom: "Custom",
  four_monthly: "Cuatrimestral",
  monthly: "Mensual",
  no_pattern: "Sin control",
  quarterly: "Trimestral",
  semiannual: "Semestral"
};

export function PaymentRuleHistory({
  categoryId,
  rules
}: PaymentRuleHistoryProps) {
  if (!rules.length) {
    return <p className={styles.empty}>No hay reglas propias para esta categoria.</p>;
  }

  const sortedRules = sortRulesForHistory(rules);

  return (
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Regla</th>
            <th>Periodicidad</th>
            <th>Vigente desde</th>
            <th>Vigente hasta</th>
            <th>Se abona</th>
            <th>Tolerancia</th>
            <th>Aviso previo</th>
            <th>Alcance</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedRules.map((rule) => {
            const isCurrent = rule.active && !rule.activeTo;

            return (
              <tr key={rule.id}>
                <td className={styles.nameCell} data-label="Regla">
                  <span className={styles.name}>{rule.name}</span>
                  {rule.notes ? <span>{rule.notes}</span> : null}
                </td>
                <td data-label="Periodicidad">
                  {formatCadence(rule)}
                </td>
                <td data-label="Vigente desde">{rule.activeFrom}</td>
                <td data-label="Vigente hasta">{rule.activeTo ?? "Abierta"}</td>
                <td data-label="Se abona">{formatPaymentTiming(rule)}</td>
                <td data-label="Tolerancia">{rule.graceDays} dias</td>
                <td data-label="Aviso previo">{rule.reminderDaysBefore} dias</td>
                <td data-label="Alcance">
                  {rule.appliesToDescendants ? "Incluye subcategorias" : "Solo esta categoria"}
                </td>
                <td data-label="Estado">
                  <span className={isCurrent ? styles.current : styles.closed}>
                    {isCurrent ? "Actual" : "Historica"}
                  </span>
                </td>
                <td className={styles.actions} data-label="Acciones">
                  {isCurrent ? (
                    <Link
                      className={styles.editLink}
                      href={`/categories/${categoryId}?ruleModal=edit&ruleId=${rule.id}`}
                    >
                      Editar
                    </Link>
                  ) : (
                    <span className={styles.unavailable}>-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatCadence(rule: PaymentRuleRow): string {
  const cadence = cadenceLabels[rule.cadence];

  if (rule.cadence === "bimonthly" && rule.anchorPeriodMonth) {
    return `${cadence}, ${rule.anchorPeriodMonth % 2 === 0 ? "pares" : "impares"}`;
  }

  if (rule.customPeriodMonths?.length) {
    return `${cadence}: ${rule.customPeriodMonths.join(", ")}`;
  }

  return cadence;
}

function formatPaymentTiming(rule: PaymentRuleRow): string {
  const month =
    rule.paymentMonth === null ? null : String(rule.paymentMonth).padStart(2, "0");
  const day =
    rule.paymentDay === null ? null : String(rule.paymentDay).padStart(2, "0");

  if (month && day) {
    return `${day}/${month}`;
  }

  if (day) {
    return `dia ${day}, ${formatPaymentOffset(rule)}`;
  }

  return formatPaymentOffset(rule);
}

function formatPaymentOffset(rule: PaymentRuleRow): string {
  if (rule.paymentMonth && rule.paymentYearOffset > 0) {
    return `mes ${String(rule.paymentMonth).padStart(2, "0")} del anio siguiente`;
  }

  if (rule.paymentMonthOffset > 0 && rule.paymentYearOffset === 0) {
    return rule.paymentMonthOffset === 1
      ? "1 mes despues del cierre"
      : `${rule.paymentMonthOffset} meses despues del cierre`;
  }

  if (rule.paymentMonthOffset === 0 && rule.paymentYearOffset === 0) {
    return rule.anchorPeriodMonth
      ? `mes fiscal ${String(rule.anchorPeriodMonth).padStart(2, "0")}`
      : "dentro del periodo";
  }

  return `offset ${rule.paymentYearOffset * 12 + rule.paymentMonthOffset} meses`;
}
