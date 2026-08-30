import { CategoryTree } from "@/components/categories/CategoryTree";
import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { listDocuments } from "@/db/documents.repository";
import { buildCategoryTree } from "@/server/categories/category-tree";
import { getCategorySummaries } from "@/server/categories/category-summary";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const [categories, documents] = await Promise.all([
    listCategoryNodes(),
    listDocuments({ limit: 1000 })
  ]);
  const activeCategories = categories.filter((category) => category.active);
  const summaries = getCategorySummaries(categories, documents);

  return (
    <div className={styles.page}>
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
        <CategoryTree nodes={buildCategoryTree(categories)} summaries={summaries} />
      </Card>
    </div>
  );
}
