import { Button } from "@/components/ui/Button";
import type { CategoryNodeRow } from "@/db/types";
import {
  buildDashboardQuery,
  getCategoryFilterLevels,
  type DashboardFilters
} from "@/server/dashboard/dashboard-filters";

export function CategoryCloudFilter({
  categories,
  filters
}: {
  categories: CategoryNodeRow[];
  filters: DashboardFilters;
}) {
  const levels = getCategoryFilterLevels(categories, filters.categoryId);

  return (
    <section className="filter-block" aria-label="Filtro por categoria">
      <h2>Categorias</h2>
      <div className="category-levels">
        <div className="chip-row">
          <Button
            href={buildDashboardQuery({ ...filters, categoryId: null })}
            variant={!filters.categoryId ? "primary" : "secondary"}
          >
            Todas
          </Button>
        </div>
        {levels.map((level) => (
          <div className="chip-row" key={level.parentId ?? "root"}>
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
        ))}
      </div>
    </section>
  );
}
