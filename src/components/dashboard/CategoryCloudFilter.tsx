"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
  const router = useRouter();
  const [travellingCategoryId, setTravellingCategoryId] = useState<string | null>(
    null
  );
  const levels = getCategoryFilterLevels(categories, filters.categoryId);
  const selectedCategory = filters.categoryId
    ? categories.find((category) => category.id === filters.categoryId) ?? null
    : null;

  const goToCategory = (categoryId: string | null) => {
    setTravellingCategoryId(categoryId ?? "all");
    window.setTimeout(() => {
      router.push(buildDashboardQuery({ ...filters, categoryId }));
    }, 360);
  };

  return (
    <section className={styles.panel} aria-label="Filtro por categoria">
      <div className={styles.heading}>
        <h2>Categorias</h2>
        <button
          className={styles.reset}
          disabled={!filters.categoryId}
          onClick={() => goToCategory(null)}
          type="button"
        >
          Todas
        </button>
      </div>

      <div className={styles.stage}>
        <div className={styles.sideRail} aria-label="Categorias disponibles">
          {(levels[0]?.categories ?? []).map((category) => (
            <AnimatedCategoryButton
              category={category}
              isSelected={filters.categoryId === category.id}
              isTravelling={travellingCategoryId === category.id}
              key={category.id}
              onClick={() => goToCategory(category.id)}
            />
          ))}
        </div>

        <div className={styles.centerNode}>
          <button
            className={[
              styles.centerChip,
              travellingCategoryId ? styles.centerChipTravelling : ""
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => selectedCategory && goToCategory(selectedCategory.id)}
            type="button"
          >
            <span>{selectedCategory?.name ?? "Todas las categorias"}</span>
            <strong>
              {selectedCategory
                ? "Categoria seleccionada"
                : "Vista completa"}
            </strong>
          </button>
        </div>
      </div>

      {levels.length > 1 ? (
        <div className={styles.tree} aria-label="Arbol de subcategorias">
          {levels.slice(1).map((level, index) => (
            <div
              className={styles.treeLevel}
              key={level.parentId ?? `level-${index}`}
              style={{ animationDelay: `${index * 90}ms` }}
            >
              <span className={styles.treeLine} />
              <div className={styles.treeChips}>
                {level.categories.map((category) => (
                  <AnimatedCategoryButton
                    category={category}
                    isSelected={filters.categoryId === category.id}
                    isTravelling={travellingCategoryId === category.id}
                    key={category.id}
                    onClick={() => goToCategory(category.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!levels.length ? (
        <p className={styles.empty}>No hay categorias activas para filtrar.</p>
      ) : null}
    </section>
  );
}

function AnimatedCategoryButton({
  category,
  isSelected,
  isTravelling,
  onClick
}: {
  category: CategoryNodeRow;
  isSelected: boolean;
  isTravelling: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={[
        styles.categoryChip,
        isSelected ? styles.categoryChipSelected : "",
        isTravelling ? styles.categoryChipTravelling : ""
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      type="button"
    >
      {category.name}
    </button>
  );
}
