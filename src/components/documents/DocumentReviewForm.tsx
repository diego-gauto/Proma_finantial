import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";
import type { CategoryNodeRow, DocumentRow } from "@/db/types";
import { getDocumentReviewIssues } from "@/server/documents/document-display";

import styles from "./DocumentReview.module.css";

interface DocumentReviewFormProps {
  action: (formData: FormData) => void | Promise<void>;
  cancelHref?: string;
  categories: CategoryNodeRow[];
  document: DocumentRow;
  redirectTo?: string;
}

export function DocumentReviewForm({
  action,
  cancelHref = "/",
  document,
  redirectTo
}: DocumentReviewFormProps) {
  const reviewIssues = getDocumentReviewIssues(document);
  const isIssue = (label: string) => reviewIssues.includes(label);

  return (
    <form action={action} className={styles.form}>
      <input name="id" type="hidden" value={document.id} />
      <input
        name="categoryNodeId"
        type="hidden"
        value={document.categoryNodeId ?? ""}
      />
      <input name="fiscalPeriodKind" type="hidden" value="month" />
      <input name="issuer" type="hidden" value={document.issuer ?? ""} />
      <input name="payee" type="hidden" value={document.payee ?? ""} />
      <input name="reason" type="hidden" value={document.reason ?? ""} />
      {redirectTo ? (
        <input name="redirectTo" type="hidden" value={redirectTo} />
      ) : null}
      {reviewIssues.length ? (
        <div className={styles.issueSummary}>
          <span>No se pudo inferir</span>
          <strong>{reviewIssues.join(", ")}</strong>
        </div>
      ) : null}
      <div className={styles.formGrid}>
        <Field className={styles.field} isFlagged={isIssue("Monto")}>
          <span>Monto</span>
          <input
            defaultValue={document.amount ?? ""}
            inputMode="decimal"
            name="amount"
            required
          />
        </Field>
        <Field className={styles.field} isFlagged={!document.currency}>
          <span>Moneda</span>
          <select defaultValue={document.currency ?? "ARS"} name="currency">
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </Field>
        <Field
          className={styles.field}
          isFlagged={isIssue("Periodo fiscal")}
        >
          <span>Periodo fiscal</span>
          <input
            defaultValue={document.fiscalPeriod ?? ""}
            name="fiscalPeriod"
            pattern="\d{4}-\d{2}"
            placeholder="2026-07"
            required
          />
        </Field>
        <Field className={styles.field} isFlagged={false}>
          <span>Meses fiscales cubiertos</span>
          <input
            defaultValue={formatCoveredFiscalMonths(document)}
            name="coveredFiscalMonths"
            placeholder="4, 5"
          />
        </Field>
        <Field className={styles.field} isFlagged={isIssue("Fecha de pago")}>
          <span>Fecha de pago</span>
          <input
            defaultValue={document.paymentDate ?? ""}
            name="paymentDate"
            required
            type="date"
          />
        </Field>
        <Field className={styles.field} isFlagged={false}>
          <span>Identificador / operacion</span>
          <input defaultValue={document.reference ?? ""} name="reference" />
        </Field>
        <Field
          className={`${styles.field} ${styles.fieldFull}`}
          isFlagged={false}
        >
          <span>Notas del corrector</span>
          <textarea
            name="userNote"
            placeholder="Agregar una nota interna si hace falta."
          />
        </Field>
      </div>
      <div className={styles.actions}>
        <Button href={cancelHref} variant="secondary">
          Cancelar
        </Button>
        <Button type="submit" variant="primary">
          Guardar correccion
        </Button>
      </div>
    </form>
  );
}

function formatCoveredFiscalMonths(document: DocumentRow): string {
  if (document.coveredFiscalMonths?.length) {
    return document.coveredFiscalMonths.join(", ");
  }

  if (document.fiscalPeriod?.includes("-")) {
    return String(Number(document.fiscalPeriod.slice(5, 7)));
  }

  return "";
}

function Field({
  children,
  className,
  isFlagged
}: {
  children: ReactNode;
  className: string;
  isFlagged: boolean;
}) {
  return (
    <label
      className={[className, isFlagged ? styles.fieldFlagged : ""]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
      {isFlagged ? (
        <small className={styles.fieldWarning}>Revisar este dato</small>
      ) : null}
    </label>
  );
}
