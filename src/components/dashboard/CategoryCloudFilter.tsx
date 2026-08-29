import { Button } from "@/components/ui/Button";
import type { CategoryNodeRow } from "@/db/types";
import {
  buildDashboardQuery,
  getCategoryFilterLevels,
  type DashboardFilters
} from "@/server/dashboard/dashboard-filters";

import styles from "./CategoryCloudFilter.module.css";

export function CategoryCloudFilter({
  categories,
  filters
}: {
  categories: CategoryNodeRow[];
  filters: DashboardFilters;
}) {
  const levels = getCategoryFilterLevels(categories, filters.categoryId);

  return (
    <div className={styles.levels} aria-label="Filtro por categoria">
      {levels.map((level, index) => (
        <section className={styles.panel} key={level.parentId ?? "root"}>
          <h2>{index === 0 ? "Categorias" : "Subcategorias"}</h2>
          <div className={styles.chipRow}>
            {index === 0 ? (
              <Button
                href={buildDashboardQuery({ ...filters, categoryId: null })}
                variant={!filters.categoryId ? "primary" : "secondary"}
              >
                Todas
              </Button>
            ) : null}
            {level.categories.map((category) => (
              <Button
                href={buildDashboardQuery({
                  ...filters,
                  categoryId: category.id
                })}
                key={category.id}
                variant={
                  filters.categoryId === category.id ? "primary" : "secondary"
                }
              >
                {category.name}
              </Button>
            ))}
          </div>
        </section>
      ))}

      {!levels.length ? (
        <section className={styles.panel}>
          <h2>Categorias</h2>
          <div className={styles.chipRow}>
            <Button
              href={buildDashboardQuery({ ...filters, categoryId: null })}
              variant={!filters.categoryId ? "primary" : "secondary"}
            >
              Todas
            </Button>
          </div>
        </section>
      ) : null}
    </div>
  );
}
