"use client";

import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react";

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
  const centerNodeRef = useRef<HTMLButtonElement | null>(null);

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
              ref={centerNodeRef}
              transition={centerTransition}
              type="button"
              data-category-center="true"
            >
              <span>{centerCategory?.name ?? "Todas las categorias"}</span>
              <strong>
                {centerCategory ? "Raiz seleccionada" : "Vista completa"}
              </strong>
            </motion.button>

            <AnimatePresence mode="wait">
              {!isChangingTree && levels.length > 1 ? (
                <MeasuredCategoryTree
                  centerNodeRef={centerNodeRef}
                  key={centerCategory?.id ?? "all-tree"}
                  levels={levels.slice(1)}
                  onSelect={goToCategory}
                  pendingCategoryId={pendingCategoryId}
                  selectedCategoryId={displayCategoryId}
                  selectedPath={selectedPath}
                  selectedPathIds={selectedPathIds}
                />
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

function MeasuredCategoryTree({
  centerNodeRef,
  levels,
  onSelect,
  pendingCategoryId,
  selectedCategoryId,
  selectedPath,
  selectedPathIds
}: {
  centerNodeRef: RefObject<HTMLButtonElement | null>;
  levels: Array<{ categories: CategoryNodeRow[]; parentId: string | null }>;
  onSelect: (categoryId: string) => void;
  pendingCategoryId: string | null;
  selectedCategoryId: string | null;
  selectedPath: CategoryNodeRow[];
  selectedPathIds: Set<string>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>());
  const levelRefs = useRef(new Map<number, HTMLDivElement>());
  const [connectorGroups, setConnectorGroups] = useState<ConnectorGroup[]>([]);
  const [levelOffsets, setLevelOffsets] = useState<number[]>([]);
  const [treeSize, setTreeSize] = useState({ height: 1, width: 1 });

  const setNodeRef = useCallback(
    (categoryId: string) => (element: HTMLButtonElement | null) => {
      if (element) {
        nodeRefs.current.set(categoryId, element);
        return;
      }

      nodeRefs.current.delete(categoryId);
    },
    []
  );
  const setLevelRef = useCallback(
    (levelIndex: number) => (element: HTMLDivElement | null) => {
      if (element) {
        levelRefs.current.set(levelIndex, element);
        return;
      }

      levelRefs.current.delete(levelIndex);
    },
    []
  );

  const measureConnectors = useCallback(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const centerNode =
      centerNodeRef.current ??
      container.parentElement?.querySelector<HTMLButtonElement>(
        "[data-category-center='true']"
      );

    if (!centerNode) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const nextTreeSize = {
      height: Math.max(1, Math.ceil(containerRect.height)),
      width: Math.max(1, Math.ceil(containerRect.width))
    };

    if (
      nextTreeSize.height !== treeSize.height ||
      nextTreeSize.width !== treeSize.width
    ) {
      setTreeSize(nextTreeSize);
    }

    const nextOffsets = levels.map((level, levelIndex) => {
      const levelElement = levelRefs.current.get(levelIndex);

      if (!levelElement) {
        return 0;
      }

      const parentElement =
        levelIndex === 0
          ? centerNode
          : nodeRefs.current.get(selectedPath[levelIndex]?.id ?? "");

      if (!parentElement) {
        return 0;
      }

      const parentRect = parentElement.getBoundingClientRect();
      const levelRect = levelElement.getBoundingClientRect();
      const previousOffset = levelOffsets[levelIndex] ?? 0;
      const naturalLeft = levelRect.left - containerRect.left - previousOffset;
      const parentX = parentRect.left + parentRect.width / 2 - containerRect.left;
      const desiredLeft = clamp(
        parentX - levelRect.width / 2,
        0,
        Math.max(0, containerRect.width - levelRect.width)
      );

      return Math.round(desiredLeft - naturalLeft);
    });

    if (!sameNumbers(nextOffsets, levelOffsets)) {
      setLevelOffsets(nextOffsets);
    }

    const nextGroups = levels.flatMap((level, levelIndex) => {
      const parentElement =
        levelIndex === 0
          ? centerNode
          : nodeRefs.current.get(selectedPath[levelIndex]?.id ?? "");

      if (!parentElement) {
        return [];
      }

      const parentRect = parentElement.getBoundingClientRect();
      const parentPoint = {
        x: parentRect.left + parentRect.width / 2 - containerRect.left,
        y: Math.max(0, parentRect.bottom - containerRect.top)
      };
      const children = level.categories.flatMap((category) => {
        const element = nodeRefs.current.get(category.id);

        if (!element) {
          return [];
        }

        const rect = element.getBoundingClientRect();

        return [
          {
            id: category.id,
            x: rect.left + rect.width / 2 - containerRect.left,
            y: rect.top - containerRect.top
          }
        ];
      });

      if (!children.length) {
        return [];
      }

      return [
        {
          children,
          id: `${level.parentId ?? "root"}-${levelIndex}`,
          levelIndex,
          parent: parentPoint
        }
      ];
    });

    setConnectorGroups(nextGroups);
  }, [centerNodeRef, levels, levelOffsets, selectedPath, treeSize]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(measureConnectors);
    const resizeObserver = new ResizeObserver(measureConnectors);

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    for (const element of nodeRefs.current.values()) {
      resizeObserver.observe(element);
    }

    for (const element of levelRefs.current.values()) {
      resizeObserver.observe(element);
    }

    if (centerNodeRef.current) {
      resizeObserver.observe(centerNodeRef.current);
    }

    window.addEventListener("resize", measureConnectors);

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("resize", measureConnectors);
    };
  }, [centerNodeRef, measureConnectors]);

  useLayoutEffect(() => {
    const firstFrame = window.requestAnimationFrame(() => {
      measureConnectors();
      window.requestAnimationFrame(measureConnectors);
    });

    return () => {
      window.cancelAnimationFrame(firstFrame);
    };
  }, [measureConnectors]);

  return (
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
      ref={containerRef}
      transition={treeTransition}
      aria-label="Arbol de subcategorias"
    >
      <svg
        className={styles.treeConnectors}
        height={treeSize.height}
        viewBox={`0 0 ${treeSize.width} ${treeSize.height}`}
        width={treeSize.width}
        aria-hidden="true"
      >
        {connectorGroups.map((group) => (
          <ConnectorGroupPath group={group} key={group.id} />
        ))}
      </svg>

      <div className={styles.treeLevels}>
        {levels.map((level, index) => (
          <div
            className={styles.treeLevel}
            key={level.parentId ?? `level-${index}`}
            ref={setLevelRef(index)}
            style={
              {
                "--tree-level-offset": `${levelOffsets[index] ?? 0}px`
              } as CSSProperties
            }
          >
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={styles.treeLevelItems}
              exit={{
                opacity: 0,
                y: -8,
                transition: { delay: Math.max(0, 0.08 - index * 0.02) }
              }}
              initial={{ opacity: 0, y: -12 }}
              transition={{ ...treeTransition, delay: index * 0.12 }}
            >
              {level.categories.map((category) => (
                <TreeCategoryButton
                  category={category}
                  key={category.id}
                  onSelect={onSelect}
                  pendingCategoryId={pendingCategoryId}
                  selectedCategoryId={selectedCategoryId}
                  selectedPathIds={selectedPathIds}
                  setNodeRef={setNodeRef(category.id)}
                />
              ))}
            </motion.div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

interface ConnectorPoint {
  id: string;
  x: number;
  y: number;
}

interface ConnectorGroup {
  children: ConnectorPoint[];
  id: string;
  levelIndex: number;
  parent: {
    x: number;
    y: number;
  };
}

function ConnectorGroupPath({ group }: { group: ConnectorGroup }) {
  const childXs = group.children.map((child) => child.x);
  const minX = Math.min(group.parent.x, ...childXs);
  const maxX = Math.max(group.parent.x, ...childXs);
  const railY = Math.max(
    group.parent.y + 18,
    Math.min(...group.children.map((child) => child.y)) - 22
  );
  const baseDelay = group.levelIndex * 0.2;

  return (
    <g>
      <motion.path
        d={`M ${group.parent.x} ${group.parent.y} V ${railY}`}
        fill="none"
        pathLength={1}
        stroke="currentColor"
        strokeDasharray="1"
        strokeLinecap="round"
        strokeDashoffset="1"
        strokeWidth="2"
        initial={{ opacity: 1, strokeDashoffset: 1 }}
        animate={{ opacity: 1, strokeDashoffset: 0 }}
        transition={{ duration: 0.22, delay: baseDelay, ease: [0.16, 1, 0.3, 1] }}
      />
      {minX !== maxX ? (
        <motion.path
          d={`M ${minX} ${railY} H ${maxX}`}
          fill="none"
          pathLength={1}
          stroke="currentColor"
          strokeDasharray="1"
          strokeLinecap="round"
          strokeDashoffset="1"
          strokeWidth="2"
          initial={{ opacity: 1, strokeDashoffset: 1 }}
          animate={{ opacity: 1, strokeDashoffset: 0 }}
          transition={{
            duration: 0.28,
            delay: baseDelay + 0.2,
            ease: [0.16, 1, 0.3, 1]
          }}
        />
      ) : null}
      {group.children.map((child, childIndex) => (
        <motion.path
          d={`M ${child.x} ${railY} V ${child.y}`}
          fill="none"
          key={child.id}
          pathLength={1}
          stroke="currentColor"
          strokeDasharray="1"
          strokeLinecap="round"
          strokeDashoffset="1"
          strokeWidth="2"
          initial={{ opacity: 1, strokeDashoffset: 1 }}
          animate={{ opacity: 1, strokeDashoffset: 0 }}
          transition={{
            duration: 0.2,
            delay: baseDelay + 0.42 + childIndex * 0.035,
            ease: [0.16, 1, 0.3, 1]
          }}
        />
      ))}
    </g>
  );
}

function TreeCategoryButton({
  category,
  onSelect,
  pendingCategoryId,
  selectedCategoryId,
  selectedPathIds,
  setNodeRef
}: {
  category: CategoryNodeRow;
  onSelect: (categoryId: string) => void;
  pendingCategoryId: string | null;
  selectedCategoryId: string | null;
  selectedPathIds: Set<string>;
  setNodeRef: (element: HTMLButtonElement | null) => void;
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
      ref={setNodeRef}
    />
  );
}

function CategoryButton({
  category,
  isActive,
  isTreeNode = false,
  isPending,
  layoutId,
  onClick,
  ref
}: {
  category: CategoryNodeRow;
  isActive: boolean;
  isTreeNode?: boolean;
  isPending: boolean;
  layoutId?: string;
  onClick: () => void;
  ref?: (element: HTMLButtonElement | null) => void;
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
      ref={ref}
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function sameNumbers(first: number[], second: number[]): boolean {
  return (
    first.length === second.length &&
    first.every((value, index) => Math.abs(value - (second[index] ?? 0)) < 1)
  );
}
