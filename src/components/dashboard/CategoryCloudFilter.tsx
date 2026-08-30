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
  const selectedPath = useMemo(
    () => getCategoryPath(categories, displayCategoryId),
    [categories, displayCategoryId]
  );
  const centerCategory = selectedPath[0] ?? null;
  const selectedPathIds = new Set(selectedPath.map((category) => category.id));
  const rootCategories = levels[0]?.categories ?? [];
  const selectedRootId = centerCategory?.id ?? null;
  const sideCategories = rootCategories.filter(
    (category) => category.id !== selectedRootId
  );
  const leftCategories = sideCategories.filter((_, index) => index % 2 === 0);
  const rightCategories = sideCategories.filter((_, index) => index % 2 === 1);

  const goToCategory = (categoryId: string | null) => {
    if (categoryId === filters.categoryId && categoryId === displayCategoryId) {
      return;
    }

    const scrollY = window.scrollY;
    setPendingCategoryId(categoryId);
    setIsChangingTree(true);

    window.setTimeout(() => {
      setDisplayCategoryId(categoryId);
      setIsChangingTree(false);
    }, 280);

    window.setTimeout(() => {
      router.push(buildDashboardQuery({ ...filters, categoryId }), {
        scroll: false
      });
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: 0, top: scrollY, behavior: "auto" });
      });
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
                centerCategory ? styles.centerChipSelected : "",
                isChangingTree ? styles.centerChipSwitching : ""
              ]
                .filter(Boolean)
                .join(" ")}
              layout
              layoutId={
                centerCategory ? `category-${centerCategory.id}` : "all"
              }
              onClick={() => centerCategory && goToCategory(centerCategory.id)}
              transition={centerTransition}
              type="button"
            >
              <span>{centerCategory?.name ?? "Todas las categorias"}</span>
              <strong>
                {centerCategory ? "Raiz seleccionada" : "Vista completa"}
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
                  key={centerCategory?.id ?? "all-tree"}
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
  const pathCategory = levelCategories.find((category) =>
    selectedPathIds.has(category.id)
  );
  const orderedCategories = pathCategory
    ? [
        ...levelCategories.filter((category) => category.id !== pathCategory.id),
        pathCategory
      ]
    : levelCategories;
  const leftCount = pathCategory
    ? Math.ceil((orderedCategories.length - 1) / 2)
    : 0;
  const leftCategories = pathCategory
    ? orderedCategories.slice(0, leftCount)
    : [];
  const rightCategories = pathCategory
    ? orderedCategories.slice(leftCount, -1)
    : [];
  const centeredCategories = pathCategory ? [pathCategory] : levelCategories;
  const connectorCount = pathCategory ? orderedCategories.length : levelCategories.length;

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
      <motion.div
        className={styles.treeBranch}
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
        <StraightTreeConnector
          childCount={connectorCount}
          hasCenteredSelection={Boolean(pathCategory)}
          levelIndex={index}
        />
        <div className={styles.treeChips}>
          <div className={styles.treeSideGroup}>
            {leftCategories.map((category) => (
              <TreeCategoryButton
                category={category}
                key={category.id}
                onSelect={onSelect}
                pendingCategoryId={pendingCategoryId}
                selectedCategoryId={selectedCategoryId}
                selectedPathIds={selectedPathIds}
              />
            ))}
          </div>
          <div className={styles.treeCenterGroup}>
            {centeredCategories.map((category) => (
              <TreeCategoryButton
                category={category}
                key={category.id}
                onSelect={onSelect}
                pendingCategoryId={pendingCategoryId}
                selectedCategoryId={selectedCategoryId}
                selectedPathIds={selectedPathIds}
              />
            ))}
          </div>
          <div className={styles.treeSideGroup}>
            {rightCategories.map((category) => (
              <TreeCategoryButton
                category={category}
                key={category.id}
                onSelect={onSelect}
                pendingCategoryId={pendingCategoryId}
                selectedCategoryId={selectedCategoryId}
                selectedPathIds={selectedPathIds}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function TreeCategoryButton({
  category,
  onSelect,
  pendingCategoryId,
  selectedCategoryId,
  selectedPathIds
}: {
  category: CategoryNodeRow;
  onSelect: (categoryId: string) => void;
  pendingCategoryId: string | null;
  selectedCategoryId: string | null;
  selectedPathIds: Set<string>;
}) {
  const isSelected = selectedCategoryId === category.id;

  return (
    <CategoryButton
      category={category}
      isActive={selectedPathIds.has(category.id)}
      isTreeNode
      isPending={pendingCategoryId === category.id}
      layoutId={isSelected ? undefined : `category-${category.id}`}
      onClick={() => onSelect(category.id)}
    />
  );
}

function StraightTreeConnector({
  childCount,
  hasCenteredSelection,
  levelIndex
}: {
  childCount: number;
  hasCenteredSelection: boolean;
  levelIndex: number;
}) {
  if (!childCount) {
    return null;
  }

  const childPositions = getConnectorPositions(childCount, hasCenteredSelection);
  const parentX = 50;
  const horizontalStart = Math.min(parentX, ...childPositions);
  const horizontalEnd = Math.max(parentX, ...childPositions);
  const path = [
    `M ${parentX} 0 V 18`,
    horizontalStart === horizontalEnd
      ? ""
      : `M ${horizontalStart} 18 H ${horizontalEnd}`,
    ...childPositions.map((position) => `M ${position} 18 V 42`)
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      className={styles.treeConnector}
      preserveAspectRatio="none"
      viewBox="0 0 100 44"
      aria-hidden="true"
    >
      <motion.path
        d={path}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        initial={{ pathLength: 0, opacity: 0.18 }}
        animate={{ pathLength: 1, opacity: 1 }}
        exit={{ pathLength: 0, opacity: 0 }}
        transition={{
          ...treeTransition,
          delay: levelIndex * 0.12 + 0.08
        }}
      />
    </svg>
  );
}

function getConnectorPositions(
  childCount: number,
  hasCenteredSelection: boolean
): number[] {
  if (childCount === 1) {
    return [50];
  }

  if (!hasCenteredSelection) {
    return Array.from(
      { length: childCount },
      (_, index) => 8 + (index * 84) / (childCount - 1)
    );
  }

  const sideCount = childCount - 1;
  const leftCount = Math.ceil(sideCount / 2);
  const rightCount = sideCount - leftCount;
  const leftPositions = Array.from({ length: leftCount }, (_, index) => {
    const divisor = Math.max(1, leftCount);
    return 16 + (index * 24) / divisor;
  });
  const rightPositions = Array.from({ length: rightCount }, (_, index) => {
    const divisor = Math.max(1, rightCount);
    return 60 + (index * 24) / divisor;
  });

  return [...leftPositions, 50, ...rightPositions];
}

function CategoryButton({
  category,
  isActive,
  isParent = false,
  isTreeNode = false,
  isPending,
  layoutId,
  onClick
}: {
  category: CategoryNodeRow;
  isActive: boolean;
  isParent?: boolean;
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
        isParent ? styles.categoryChipParent : "",
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
