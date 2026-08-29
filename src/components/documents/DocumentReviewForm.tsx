import { Button } from "@/components/ui/Button";
import type { CategoryNodeRow, DocumentRow } from "@/db/types";

import styles from "./DocumentReview.module.css";

interface DocumentReviewFormProps {
  action: (formData: FormData) => void | Promise<void>;
  categories: CategoryNodeRow[];
  document: DocumentRow;
}

export function DocumentReviewForm({
  action,
  categories,
  document
}: DocumentReviewFormProps) {
  return (
    <form action={action} className={styles.form}>
      <input name="id" type="hidden" value={document.id} />
      <div className={styles.formGrid}>
        <label className={styles.field}>
          <span>Monto</span>
          <input
            defaultValue={document.amount ?? ""}
            inputMode="decimal"
            name="amount"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Moneda</span>
          <select defaultValue={document.currency ?? "ARS"} name="currency">
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </label>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Categoria</span>
          <select
            defaultValue={document.categoryNodeId ?? ""}
            name="categoryNodeId"
            required
          >
            <option value="">Elegir categoria</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Periodo fiscal</span>
          <input
            defaultValue={document.fiscalPeriod ?? ""}
            name="fiscalPeriod"
            pattern="\d{4}(-\d{2})?"
            placeholder="2026-08"
            required
          />
        </label>
        <label className={styles.field}>
          <span>Tipo de periodo</span>
          <select
            defaultValue={document.fiscalPeriodKind}
            name="fiscalPeriodKind"
          >
            <option value="month">Mensual</option>
            <option value="year">Anual</option>
            <option value="unknown">Sin determinar</option>
          </select>
        </label>
        <label className={styles.field}>
          <span>Fecha de pago</span>
          <input
            defaultValue={document.paymentDate ?? ""}
            name="paymentDate"
            required
            type="date"
          />
        </label>
        <label className={styles.field}>
          <span>Identificador / operacion</span>
          <input defaultValue={document.reference ?? ""} name="reference" />
        </label>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Motivo</span>
          <input defaultValue={document.reason ?? ""} name="reason" required />
        </label>
        <label className={styles.field}>
          <span>Entidad emisora</span>
          <input defaultValue={document.issuer ?? ""} name="issuer" />
        </label>
        <label className={styles.field}>
          <span>Entidad pagadora</span>
          <input defaultValue={document.payee ?? ""} name="payee" />
        </label>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span>Nota de correccion</span>
          <textarea defaultValue={document.userNote ?? ""} name="userNote" />
        </label>
      </div>
      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          Guardar como procesado
        </Button>
      </div>
    </form>
  );
}
