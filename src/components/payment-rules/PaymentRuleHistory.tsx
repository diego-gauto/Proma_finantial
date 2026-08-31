import { Button } from "@/components/ui/Button";
import type { PaymentRuleRow } from "@/db/types";

import styles from "./PaymentRuleHistory.module.css";

interface PaymentRuleHistoryProps {
  action: (formData: FormData) => void | Promise<void>;
  categoryNodeId: string;
  rules: PaymentRuleRow[];
}

const cadenceLabels: Record<PaymentRuleRow["cadence"], string> = {
  annual: "Anual",
  bimonthly: "Bimestral",
  custom: "Custom",
  four_monthly: "Cuatrimestral",
  monthly: "Mensual",
  no_pattern: "Sin patron",
  quarterly: "Trimestral",
  semiannual: "Semestral"
};

export function PaymentRuleHistory({
  action,
  categoryNodeId,
  rules
}: PaymentRuleHistoryProps) {
  if (!rules.length) {
    return <p className={styles.empty}>No hay reglas propias para esta categoria.</p>;
  }

  return (
    <div className={styles.history}>
      {rules.map((rule) => (
        <article className={styles.rule} key={rule.id}>
          <div>
            <h3>{rule.name}</h3>
            <div className={styles.meta}>
              <span>{cadenceLabels[rule.cadence]}</span>
              <span>Desde {rule.activeFrom}</span>
              <span>Hasta {rule.activeTo ?? "abierta"}</span>
              <span>{rule.graceDays} dias tolerancia</span>
              <span>{rule.reminderDaysBefore} dias aviso</span>
              {rule.customPeriodMonths?.length ? (
                <span>Meses {rule.customPeriodMonths.join(", ")}</span>
              ) : null}
              {rule.appliesToDescendants ? <span>Hereda a hijos</span> : null}
            </div>
            {rule.notes ? <p className="muted">{rule.notes}</p> : null}
          </div>
          {rule.active && !rule.activeTo ? (
            <form action={action} className={styles.closeForm}>
              <input name="ruleId" type="hidden" value={rule.id} />
              <input name="categoryNodeId" type="hidden" value={categoryNodeId} />
              <input
                aria-label="Fecha de cierre"
                defaultValue={new Date().toISOString().slice(0, 10)}
                name="activeTo"
                type="date"
              />
              <Button type="submit">Cerrar</Button>
            </form>
          ) : null}
        </article>
      ))}
    </div>
  );
}
