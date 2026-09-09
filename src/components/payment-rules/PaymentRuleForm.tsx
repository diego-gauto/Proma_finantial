"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import type { CategoryNodeRow, PaymentRuleRow } from "@/db/types";

import { buildSuggestedRuleName } from "./payment-rule-presenter";
import styles from "./PaymentRuleForm.module.css";

interface PaymentRuleFormProps {
  action: (formData: FormData) => void | Promise<void>;
  category: CategoryNodeRow;
  cancelHref?: string;
  canApplyToDescendants?: boolean;
  existingRuleNames?: string[];
  initialRule?: PaymentRuleRow | null;
  minimumActiveFromMonth?: string;
  submitLabel?: string;
}

type Periodicity =
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "four_monthly"
  | "semiannual"
  | "annual"
  | "custom"
  | "no_pattern";

type PaymentTiming = "within_period" | "after_period_end";

const periodicityIntervals: Record<Exclude<Periodicity, "custom" | "no_pattern">, number> = {
  annual: 12,
  bimonthly: 2,
  four_monthly: 4,
  monthly: 1,
  quarterly: 3,
  semiannual: 6
};

const monthOptions = [
  { label: "Enero", value: "1" },
  { label: "Febrero", value: "2" },
  { label: "Marzo", value: "3" },
  { label: "Abril", value: "4" },
  { label: "Mayo", value: "5" },
  { label: "Junio", value: "6" },
  { label: "Julio", value: "7" },
  { label: "Agosto", value: "8" },
  { label: "Septiembre", value: "9" },
  { label: "Octubre", value: "10" },
  { label: "Noviembre", value: "11" },
  { label: "Diciembre", value: "12" }
];

export function PaymentRuleForm({
  action,
  cancelHref,
  canApplyToDescendants = true,
  category,
  existingRuleNames = [],
  initialRule = null,
  minimumActiveFromMonth,
  submitLabel = "Aplicar"
}: PaymentRuleFormProps) {
  const currentDate = new Date();
  const currentMonth = currentDate.toISOString().slice(0, 7);
  const [periodicity, setPeriodicity] = useState<Periodicity>(
    initialRule ? getPeriodicityValue(initialRule) : "monthly"
  );
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>(
    initialRule ? getPaymentTimingValue(initialRule) : "after_period_end"
  );
  const hasPaymentSchedule = periodicity !== "no_pattern";
  const fixedInterval =
    periodicity !== "custom" && periodicity !== "no_pattern"
      ? periodicityIntervals[periodicity]
      : null;
  const monthWithinPeriodOptions = Array.from(
    { length: fixedInterval ?? 1 },
    (_, index) => String(index + 1)
  );
  const suggestedName = buildSuggestedRuleName(
    category.name,
    currentDate,
    existingRuleNames
  );

  return (
    <form action={action} className={styles.form}>
      <input name="categoryNodeId" type="hidden" value={category.id} />
      {initialRule ? (
        <input name="ruleId" type="hidden" value={initialRule.id} />
      ) : null}
      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h3>Identificacion</h3>
          <p>Te dejamos un nombre sugerido para que no tengas que pensarlo.</p>
        </div>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.nameField}`}>
            <label htmlFor="rule-name">Nombre</label>
            <input
              defaultValue={initialRule?.name ?? suggestedName}
              id="rule-name"
              name="name"
              required
            />
          </div>
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h3>Frecuencia de control</h3>
          <p>Aca agrupamos periodicidad, forma de pago y meses esperados.</p>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="periodicity">Periodicidad</label>
            <select
              id="periodicity"
              name="periodicity"
              onChange={(event) =>
                setPeriodicity(event.target.value as Periodicity)
              }
              value={periodicity}
            >
              <option value="monthly">Mensual</option>
              <option value="bimonthly">Bimestral</option>
              <option value="quarterly">Trimestral</option>
              <option value="four_monthly">Cuatrimestral</option>
              <option value="semiannual">Semestral</option>
              <option value="annual">Anual</option>
              <option value="custom">Personalizado</option>
              <option value="no_pattern">Sin control</option>
            </select>
          </div>

          {hasPaymentSchedule ? (
            fixedInterval ? (
              <>
                <div className={styles.field}>
                  <label htmlFor="paymentTimingSelect">Se paga</label>
                  <select
                    id="paymentTimingSelect"
                    name="paymentTiming"
                    onChange={(event) =>
                      setPaymentTiming(event.target.value as PaymentTiming)
                    }
                    value={paymentTiming}
                  >
                    <option value="within_period">Dentro del periodo</option>
                    <option value="after_period_end">A periodo vencido</option>
                  </select>
                </div>

                {paymentTiming === "within_period" ? (
                  <div className={styles.field}>
                    <label htmlFor="paymentMonthWithinPeriod">
                      Mes del periodo en que se paga
                    </label>
                    <select
                      defaultValue={String(
                        getPaymentMonthWithinPeriod(initialRule, fixedInterval)
                      )}
                      id="paymentMonthWithinPeriod"
                      name="paymentMonthWithinPeriod"
                    >
                      {monthWithinPeriodOptions.map((month) => (
                        <option key={month} value={month}>
                          Mes {month} de {fixedInterval}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className={styles.field}>
                    <label htmlFor="monthsAfterPeriodEnd">
                      Meses despues del cierre
                    </label>
                    <select
                      defaultValue={String(initialRule?.paymentMonthOffset || 1)}
                      id="monthsAfterPeriodEnd"
                      name="monthsAfterPeriodEnd"
                    >
                      {monthOptions.map((_, index) => {
                        const monthCount = index + 1;
                        return (
                          <option key={monthCount} value={monthCount}>
                            {monthCount === 1
                              ? "1 mes despues"
                              : `${monthCount} meses despues`}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.field}>
                <label htmlFor="paymentTimingSelect">Se paga</label>
                <select
                  id="paymentTimingSelect"
                  name="paymentTiming"
                  onChange={(event) =>
                    setPaymentTiming(event.target.value as PaymentTiming)
                  }
                  value={paymentTiming}
                >
                  <option value="within_period">Dentro del periodo</option>
                  <option value="after_period_end">A periodo vencido</option>
                </select>
              </div>
            )
          ) : null}

          {hasPaymentSchedule &&
          !fixedInterval &&
          paymentTiming === "after_period_end" ? (
            <div className={styles.field}>
              <label htmlFor="monthsAfterPeriodEnd">
                Meses despues del cierre
              </label>
              <select
                defaultValue={String(initialRule?.paymentMonthOffset || 1)}
                id="monthsAfterPeriodEnd"
                name="monthsAfterPeriodEnd"
              >
                {monthOptions.map((_, index) => {
                  const monthCount = index + 1;
                  return (
                    <option key={monthCount} value={monthCount}>
                      {monthCount === 1
                        ? "1 mes despues"
                        : `${monthCount} meses despues`}
                    </option>
                  );
                })}
              </select>
            </div>
          ) : null}

          {periodicity === "bimonthly" && !fixedInterval ? (
            <div className={styles.field}>
              <label htmlFor="bimonthlyParity">Meses esperados</label>
              <select
                defaultValue={getBimonthlyParity(initialRule)}
                id="bimonthlyParity"
                name="bimonthlyParity"
              >
                <option value="even">Pares</option>
                <option value="odd">Impares</option>
              </select>
            </div>
          ) : null}

          {periodicity === "custom" ? (
            <div className={`${styles.field} ${styles.fieldFull}`}>
              <label htmlFor="customPeriodMonths">Meses esperados</label>
              <input
                defaultValue={initialRule?.customPeriodMonths?.join(", ") ?? ""}
                id="customPeriodMonths"
                inputMode="numeric"
                name="customPeriodMonths"
                placeholder="1, 4, 10"
                required
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h3>Vigencia</h3>
          <p>Define desde cuando empieza a aplicarse esta version de la regla.</p>
        </div>
        <div className={styles.grid}>
          <div className={styles.field}>
            <label htmlFor="activeFromMonth">Vigente desde</label>
            <input
              defaultValue={initialRule?.activeFrom.slice(0, 7) ?? currentMonth}
              id="activeFromMonth"
              min={minimumActiveFromMonth}
              name="activeFromMonth"
              required
              type="month"
            />
          </div>
        </div>
      </section>

      {hasPaymentSchedule ? (
        <section className={styles.group}>
          <div className={styles.groupHeader}>
            <h3>Seguimiento operativo</h3>
            <p>Los tres campos quedan juntos para leer rapido el comportamiento esperado.</p>
          </div>
          <div className={styles.grid}>
            <div className={styles.field}>
              <label htmlFor="paymentDay">Dia probable de pago</label>
              <input
                defaultValue={String(initialRule?.paymentDay ?? 10)}
                id="paymentDay"
                max="31"
                min="1"
                name="paymentDay"
                required
                type="number"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="reminderDaysBefore">Avisar dias antes</label>
              <input
                defaultValue={String(initialRule?.reminderDaysBefore ?? 7)}
                id="reminderDaysBefore"
                min="0"
                name="reminderDaysBefore"
                type="number"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="graceDays">Tolerancia</label>
              <input
                defaultValue={String(initialRule?.graceDays ?? 5)}
                id="graceDays"
                min="0"
                name="graceDays"
                type="number"
              />
            </div>
          </div>
        </section>
      ) : null}

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h3>Alcance</h3>
          <p>
            {canApplyToDescendants
              ? "Indica si la regla tambien debe usarse en subcategorias."
              : "Esta categoria no tiene subcategorias para incluir."}
          </p>
        </div>
        <label
          className={`${styles.checkbox} ${
            canApplyToDescendants ? "" : styles.checkboxDisabled
          }`}
        >
          <input
            defaultChecked={
              canApplyToDescendants &&
              (initialRule?.appliesToDescendants ?? false)
            }
            disabled={!canApplyToDescendants}
            name="appliesToDescendants"
            type="checkbox"
          />
          <span>Aplicar a descendientes</span>
        </label>
      </section>

      <section className={styles.group}>
        <div className={styles.groupHeader}>
          <h3>Notas</h3>
          <p>Contexto corto para futuras revisiones del historial.</p>
        </div>
        <div className={styles.grid}>
          <div className={`${styles.field} ${styles.fieldFull}`}>
            <label htmlFor="notes">Notas</label>
            <textarea defaultValue={initialRule?.notes ?? ""} id="notes" name="notes" />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        {cancelHref ? (
          <Button href={cancelHref} variant="secondary">
            Cancelar
          </Button>
        ) : null}
        <Button type="submit" variant="primary">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

function getPeriodicityValue(rule: PaymentRuleRow): Periodicity {
  return rule.cadence;
}

function getPaymentTimingValue(rule: PaymentRuleRow): PaymentTiming {
  if (rule.paymentMonthOffset > 0 || rule.paymentYearOffset > 0) {
    return "after_period_end";
  }

  return "within_period";
}

function getBimonthlyParity(rule: PaymentRuleRow | null): "even" | "odd" {
  if (rule?.anchorPeriodMonth && rule.anchorPeriodMonth % 2 !== 0) {
    return "odd";
  }

  return "even";
}

function getPaymentMonthWithinPeriod(
  rule: PaymentRuleRow | null,
  intervalMonths: number
): number {
  const month = rule?.anchorPeriodMonth ?? 1;

  if (month < 1 || month > intervalMonths) {
    return 1;
  }

  return month;
}
