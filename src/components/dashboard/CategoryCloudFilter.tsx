"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { CategoryNodeRow } from "@/db/types";
import {
  buildDashboardQuery,
  getCategoryFilterLevels,
  type DashboardFilters
} from "@/server/dashboard/dashboard-filters";

import styles from "./CategoryCloudFilter.module.css";

const centerTransition = {
  duration: 0.72,
  ease: [0.16, 1, 0.3, 1]
} as const;

const treeTransition = {
  duration: 0.54,
  ease: [0.16, 1, 0.3, 1]
} as const;

export function CategoryCloudFilter({
  categories,
  filters
}: {
  categories: CategoryNodeRow[];
  filters: DashboardFilters;
}) {
  return (
    <CategoryCloudFilterSurface
      categories={categories}
      filters={filters}
      key={filters.categoryId ?? "all"}
    />
  );
}

function CategoryCloudFilterSurface({
  categories,
  filters
}: {
  categories: CategoryNodeRow[];
  filters: DashboardFilters;
}) {
  const router = useRouter();
  const [displayCategoryId, setDisplayCategoryId] = useState<string | null>(
    filters.categoryId
  );
  const [isChangingTree, setIsChangingTree] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);

  const levels = getCategoryFilterLevels(categories, displayCategoryId);
  const selectedCategory = displayCategoryId
    ? categories.find((category) => category.id === displayCategoryId) ?? null
    : null;
  const selectedPath = useMemo(
    () => getCategoryPath(categories, displayCategoryId),
    [categories, displayCategoryId]
  );
  const selectedPathIds = new Set(selectedPath.map((category) => category.id));
  const rootCategories = levels[0]?.categories ?? [];
  const selectedRootId = selectedPath[0]?.id ?? null;
  const sideCategories = rootCategories.filter(
    (category) => category.id !== selectedRootId
  );
  const leftCategories = sideCategories.filter((_, index) => index % 2 === 0);
  const rightCategories = sideCategories.filter((_, index) => index % 2 === 1);

  const goToCategory = (categoryId: string | null) => {
    if (categoryId === filters.categoryId && categoryId === displayCategoryId) {
      return;
    }

    setPendingCategoryId(categoryId);
    setIsChangingTree(true);

    window.setTimeout(() => {
      setDisplayCategoryId(categoryId);
      setIsChangingTree(false);
    }, 280);

    window.setTimeout(() => {
      router.push(buildDashboardQuery({ ...filters, categoryId }));
    }, 880);
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

      <LayoutGroup id="category-filter-stage">
        <div className={styles.stage}>
          <motion.div
            className={styles.sideRail}
            layout
            aria-label="Categorias a la izquierda"
          >
            {leftCategories.map((category) => (
              <CategoryButton
                category={category}
                isActive={false}
                isPending={pendingCategoryId === category.id}
                key={category.id}
                layoutId={`category-${category.id}`}
                onClick={() => goToCategory(category.id)}
              />
            ))}
          </motion.div>

          <div className={styles.centerStack}>
            <motion.button
              className={[
                styles.centerChip,
                selectedCategory ? styles.centerChipSelected : "",
                isChangingTree ? styles.centerChipSwitching : ""
              ]
                .filter(Boolean)
                .join(" ")}
              layout
              layoutId={
                selectedCategory ? `category-${selectedCategory.id}` : "all"
              }
              onClick={() => selectedCategory && goToCategory(selectedCategory.id)}
              transition={centerTransition}
              type="button"
            >
              <span>{selectedCategory?.name ?? "Todas las categorias"}</span>
              <strong>
                {selectedCategory ? "Categoria seleccionada" : "Vista completa"}
              </strong>
            </motion.button>

            <AnimatePresence mode="wait">
              {!isChangingTree && levels.length > 1 ? (
                <motion.div
                  animate={{ opacity: 1, y: 0 }}
                  className={styles.tree}
                  exit={{
                    opacity: 0,
                    filter: "blur(10px)",
                    scale: 0.96,
                    transition: { duration: 0.24 }
                  }}
                  initial={{ opacity: 0, y: -12 }}
                  key={selectedCategory?.id ?? "all-tree"}
                  transition={treeTransition}
                  aria-label="Arbol de subcategorias"
                >
                  {levels.slice(1).map((level, index) => (
                    <TreeLevel
                      index={index}
                      key={level.parentId ?? `level-${index}`}
                      levelCategories={level.categories}
                      onSelect={goToCategory}
                      pendingCategoryId={pendingCategoryId}
                      selectedCategoryId={displayCategoryId}
                      selectedPathIds={selectedPathIds}
                    />
                  ))}
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <motion.div
            className={styles.sideRail}
            layout
            aria-label="Categorias a la derecha"
          >
            {rightCategories.map((category) => (
              <CategoryButton
                category={category}
                isActive={false}
                isPending={pendingCategoryId === category.id}
                key={category.id}
                layoutId={`category-${category.id}`}
                onClick={() => goToCategory(category.id)}
              />
            ))}
          </motion.div>
        </div>
      </LayoutGroup>

      {!levels.length ? (
        <p className={styles.empty}>No hay categorias activas para filtrar.</p>
      ) : null}
    </section>
  );
}

function TreeLevel({
  index,
  levelCategories,
  onSelect,
  pendingCategoryId,
  selectedCategoryId,
  selectedPathIds
}: {
  index: number;
  levelCategories: CategoryNodeRow[];
  onSelect: (categoryId: string) => void;
  pendingCategoryId: string | null;
  selectedCategoryId: string | null;
  selectedPathIds: Set<string>;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.treeLevel}
      exit={{
        opacity: 0,
        y: -8,
        transition: { delay: Math.max(0, 0.08 - index * 0.02) }
      }}
      initial={{ opacity: 0, y: -12 }}
      transition={{ ...treeTransition, delay: index * 0.12 }}
    >
      <svg
        className={styles.treeConnector}
        preserveAspectRatio="none"
        viewBox="0 0 100 34"
        aria-hidden="true"
      >
        <motion.path
          d="M50 0 C50 14 18 12 18 32 M50 0 C50 14 82 12 82 32"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: 1, opacity: 1 }}
          exit={{ pathLength: 0, opacity: 0 }}
          transition={{ ...treeTransition, delay: index * 0.12 + 0.08 }}
        />
      </svg>
      <motion.div
        className={styles.treeChips}
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={{
          hidden: {},
          visible: {
            transition: {
              delayChildren: index * 0.12 + 0.22,
              staggerChildren: 0.055
            }
          }
        }}
      >
        {levelCategories.map((category) => {
          const isSelected = selectedCategoryId === category.id;

          return (
            <CategoryButton
              category={category}
              isActive={selectedPathIds.has(category.id)}
              isTreeNode
              isPending={pendingCategoryId === category.id}
              key={category.id}
              layoutId={isSelected ? undefined : `category-${category.id}`}
              onClick={() => onSelect(category.id)}
            />
          );
        })}
      </motion.div>
    </motion.div>
  );
}

function CategoryButton({
  category,
  isActive,
  isTreeNode = false,
  isPending,
  layoutId,
  onClick
}: {
  category: CategoryNodeRow;
  isActive: boolean;
  isTreeNode?: boolean;
  isPending: boolean;
  layoutId?: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      animate="visible"
      className={[
        styles.categoryChip,
        isTreeNode ? styles.treeCategoryChip : "",
        isActive ? styles.categoryChipSelected : "",
        isPending ? styles.categoryChipPending : ""
      ]
        .filter(Boolean)
        .join(" ")}
      exit={{ opacity: 0, scale: 0.88, filter: "blur(8px)" }}
      initial="hidden"
      layout
      layoutId={layoutId}
      onClick={onClick}
      transition={centerTransition}
      type="button"
      variants={{
        hidden: { opacity: 0, scale: 0.9, y: 10 },
        visible: { opacity: 1, scale: 1, y: 0 }
      }}
      whileHover={{ scale: 1.05, y: -2 }}
      whileTap={{ scale: 0.96 }}
    >
      {category.name}
    </motion.button>
  );
}

function getCategoryPath(
  categories: CategoryNodeRow[],
  selectedCategoryId: string | null
): CategoryNodeRow[] {
  if (!selectedCategoryId) {
    return [];
  }

  const byId = new Map(categories.map((category) => [category.id, category]));
  const path: CategoryNodeRow[] = [];
  let current = byId.get(selectedCategoryId);

  while (current) {
    path.unshift(current);
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }

  return path;
}
