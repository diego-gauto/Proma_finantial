import Link from "next/link";

import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { listPaymentRules } from "@/db/payment-rules.repository";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function RulesPage() {
  const [categories, rules] = await Promise.all([
    listCategoryNodes(),
    listPaymentRules()
  ]);
  const categoriesById = new Map(categories.map((category) => [category.id, category]));

  return (
    <div className={styles.page}>
      <Card title="Reglas de pago">
        <div className={styles.rules}>
          {rules.map((rule) => (
            <article className={styles.rule} key={rule.id}>
              <div>
                <Link href={`/categories/${rule.categoryNodeId}`}>
                  {rule.name}
                </Link>
                <div className={styles.meta}>
                  <span>
                    {categoriesById.get(rule.categoryNodeId)?.name ??
                      `Categoria ${rule.categoryNodeId}`}
                  </span>
                  <span>Desde {rule.activeFrom}</span>
                  <span>Hasta {rule.activeTo ?? "abierta"}</span>
                  <span>{rule.active ? "Activa" : "Cerrada"}</span>
                </div>
              </div>
              <Link href={`/categories/${rule.categoryNodeId}`}>
                Configurar
              </Link>
            </article>
          ))}
          {!rules.length ? (
            <p className="muted">
              No hay reglas cargadas. Entra a una categoria para crear la primera.
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
