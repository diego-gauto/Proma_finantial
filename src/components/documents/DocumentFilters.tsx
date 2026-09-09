import Link from "next/link";

import { Button } from "@/components/ui/Button";
import type { CategoryNodeRow } from "@/db/types";
import type { ParsedDocumentSearchParams } from "@/server/documents/document-search-params";

import styles from "./DocumentFilters.module.css";

interface DocumentFiltersProps {
  categories: CategoryNodeRow[];
  filters: ParsedDocumentSearchParams;
}

export function DocumentFilters({
  categories,
  filters
}: DocumentFiltersProps) {
  return (
    <form action="/documents" className={styles.filters}>
      <div className={styles.grid}>
        <label className={styles.field}>
          <span>Texto</span>
          <input
            defaultValue={filters.search ?? ""}
            name="search"
            placeholder="Documento o referencia"
          />
        </label>
        <label className={styles.field}>
          <span>Periodo fiscal</span>
          <input
            defaultValue={filters.fiscalPeriod ?? ""}
            name="fiscalPeriod"
            placeholder="2026 o 2026-08"
          />
        </label>
        <label className={styles.field}>
          <span>Categoria</span>
          <select defaultValue={filters.categoryId ?? ""} name="categoryId">
            <option value="">Todas</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className={styles.field}>
          <span>Desde pago</span>
          <input
            defaultValue={filters.paymentDateFrom ?? ""}
            name="paymentDateFrom"
            type="date"
          />
        </label>
        <label className={styles.field}>
          <span>Hasta pago</span>
          <input
            defaultValue={filters.paymentDateTo ?? ""}
            name="paymentDateTo"
            type="date"
          />
        </label>
        <label className={styles.field}>
          <span>Estado</span>
          <select
            defaultValue={filters.processingStatus ?? ""}
            name="processingStatus"
          >
            <option value="">Todos</option>
            <option value="processed">Procesado</option>
            <option value="review_required">Requiere revision</option>
            <option value="error">Error</option>
            <option value="pending">Pendiente</option>
          </select>
        </label>
      </div>
      {filters.status ? (
        <input name="status" type="hidden" value={filters.status} />
      ) : null}
      <div className={styles.actions}>
        <Button type="submit" variant="primary">
          Filtrar
        </Button>
        <Link href="/documents">Limpiar</Link>
      </div>
    </form>
  );
}
