import { Button } from "@/components/ui/Button";
import type { CategoryNodeRow } from "@/db/types";

import styles from "./PaymentRuleForm.module.css";

interface PaymentRuleFormProps {
  action: (formData: FormData) => void | Promise<void>;
  category: CategoryNodeRow;
}

export function PaymentRuleForm({ action, category }: PaymentRuleFormProps) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className={styles.form}>
      <input name="categoryNodeId" type="hidden" value={category.id} />
      <div className={styles.grid}>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="rule-name">Nombre</label>
          <input
            defaultValue={`Regla ${category.name}`}
            id="rule-name"
            name="name"
            required
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="intervalMonths">Periodicidad</label>
          <select defaultValue="1" id="intervalMonths" name="intervalMonths">
            <option value="">Sin patron</option>
            <option value="1">Mensual</option>
            <option value="2">Bimestral</option>
            <option value="3">Trimestral</option>
            <option value="4">Cuatrimestral</option>
            <option value="6">Semestral</option>
            <option value="12">Anual</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="fiscalPeriodKind">Periodo fiscal esperado</label>
          <select defaultValue="month" id="fiscalPeriodKind" name="fiscalPeriodKind">
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
            <option value="unknown">Sin determinar</option>
          </select>
        </div>
        <div className={styles.field}>
          <label htmlFor="activeFrom">Vigente desde</label>
          <input defaultValue={today} id="activeFrom" name="activeFrom" required type="date" />
        </div>
        <div className={styles.field}>
          <label htmlFor="paymentMonth">Mes probable de pago</label>
          <input id="paymentMonth" max="12" min="1" name="paymentMonth" type="number" />
        </div>
        <div className={styles.field}>
          <label htmlFor="paymentDay">Dia probable de pago</label>
          <input defaultValue="10" id="paymentDay" max="31" min="1" name="paymentDay" type="number" />
        </div>
        <div className={styles.field}>
          <label htmlFor="paymentMonthOffset">Offset mes pago</label>
          <input defaultValue="1" id="paymentMonthOffset" name="paymentMonthOffset" type="number" />
        </div>
        <div className={styles.field}>
          <label htmlFor="paymentYearOffset">Offset anio pago</label>
          <input defaultValue="0" id="paymentYearOffset" name="paymentYearOffset" type="number" />
        </div>
        <div className={styles.field}>
          <label htmlFor="graceDays">Tolerancia</label>
          <input defaultValue="5" id="graceDays" min="0" name="graceDays" type="number" />
        </div>
        <div className={styles.field}>
          <label htmlFor="reminderDaysBefore">Avisar dias antes</label>
          <input defaultValue="7" id="reminderDaysBefore" min="0" name="reminderDaysBefore" type="number" />
        </div>
        <label className={styles.checkbox}>
          <input name="appliesToDescendants" type="checkbox" />
          <span>Aplicar a descendientes</span>
        </label>
        <div className={`${styles.field} ${styles.fieldFull}`}>
          <label htmlFor="notes">Notas</label>
          <textarea id="notes" name="notes" />
        </div>
      </div>
      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          Crear regla
        </Button>
      </div>
    </form>
  );
}
