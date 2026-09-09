import { CategoryTree } from "@/components/categories/CategoryTree";
import { BackLink } from "@/components/navigation/BackLink";
import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { listDocuments } from "@/db/documents.repository";
import { listPaymentRules } from "@/db/payment-rules.repository";
import { buildCategoryTree } from "@/server/categories/category-tree";
import { getCategoryRuleSummaries } from "@/server/categories/category-rule-summary";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, documents, rules] = await Promise.all([
    listCategoryNodes(),
    listDocuments({ limit: 1000 }),
    listPaymentRules()
  ]);
  const activeCategories = categories.filter((category) => category.active);
  const ruleSummaries = getCategoryRuleSummaries(
    categories,
    rules,
    new Date().toISOString().slice(0, 7)
  );

  return (
    <div className={styles.page}>
      <BackLink href="/" />
      <section className={styles.summaryGrid}>
        <div className={styles.metric}>
          <span>Categorias totales</span>
          <strong>{categories.length}</strong>
        </div>
        <div className={styles.metric}>
          <span>Categorias activas</span>
          <strong>{activeCategories.length}</strong>
        </div>
        <div className={styles.metric}>
          <span>Documentos vinculados</span>
          <strong>{documents.filter((document) => document.categoryNodeId).length}</strong>
        </div>
      </section>

      <Card title="Arbol de categorias">
        <CategoryTree
          nodes={buildCategoryTree(categories)}
          ruleSummaries={ruleSummaries}
        />
      </Card>
    </div>
  );
}
