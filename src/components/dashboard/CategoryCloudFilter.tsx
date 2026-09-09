"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  type CSSProperties,
  useCallback,
  useEffect,
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
import {
  buildCategoryConnectorLayout,
  type CategoryConnectorLayout,
  type CategoryLayoutNode,
  type ConnectorGroup
} from "./category-connector-geometry";

import styles from "./CategoryCloudFilter.module.css";

const treeTransition = {
  duration: 0.42,
  ease: [0.16, 1, 0.3, 1]
} as const;

const chipTransition = {
  duration: 0.18,
  ease: [0.16, 1, 0.3, 1]
} as const;

export function CategoryCloudFilter({
  categories,
  filters,
  queryParams,
  pathname = "/"
}: {
  categories: CategoryNodeRow[];
  filters: DashboardFilters;
  pathname?: string;
  queryParams?: Record<string, string | null | undefined>;
}) {
  return (
    <CategoryCloudFilterSurface
      categories={categories}
      filters={filters}
      pathname={pathname}
      queryParams={queryParams}
    />
  );
}

function CategoryCloudFilterSurface({
  categories,
  filters,
  pathname,
  queryParams = {}
}: {
  categories: CategoryNodeRow[];
  filters: DashboardFilters;
  pathname: string;
  queryParams?: Record<string, string | null | undefined>;
}) {
  const router = useRouter();
  const [displayCategoryId, setDisplayCategoryId] = useState<string | null>(
    filters.categoryId
  );
  const [isNavigatingCategory, setIsNavigatingCategory] = useState(false);
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const routeTimerRef = useRef<number | null>(null);

  const visibleCategoryId = isNavigatingCategory
    ? displayCategoryId
    : filters.categoryId;
  const levels = getCategoryFilterLevels(categories, visibleCategoryId);
  const selectedPath = useMemo(
    () => getCategoryPath(categories, visibleCategoryId),
    [categories, visibleCategoryId]
  );
  const selectedPathIds = new Set(selectedPath.map((category) => category.id));
  const rootCategories = levels[0]?.categories ?? [];
  const selectedRoot = selectedPath[0] ?? null;
  const treeLevels = selectedRoot
    ? [
        { categories: [selectedRoot], parentId: null },
        ...levels.slice(1)
      ]
    : [];

  const goToCategory = (categoryId: string | null) => {
    if (categoryId === filters.categoryId && categoryId === displayCategoryId) {
      return;
    }

    const scrollY = window.scrollY;
    setPendingCategoryId(categoryId);
    setIsNavigatingCategory(true);
    setDisplayCategoryId(categoryId);

    if (routeTimerRef.current) {
      window.clearTimeout(routeTimerRef.current);
    }

    routeTimerRef.current = window.setTimeout(() => {
      router.push(
        buildDashboardQuery({ ...filters, categoryId }, pathname, queryParams),
        {
          scroll: false
        }
      );
      window.requestAnimationFrame(() => {
        window.scrollTo({ left: 0, top: scrollY, behavior: "auto" });
      });
      window.setTimeout(() => {
        setPendingCategoryId(null);
        setIsNavigatingCategory(false);
      }, 240);
    }, 880);
  };

  useEffect(() => {
    return () => {
      if (routeTimerRef.current) {
        window.clearTimeout(routeTimerRef.current);
      }
    };
  }, []);

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

      {rootCategories.length ? (
        <div className={styles.categoryWall} aria-label="Categorias raiz">
          {rootCategories.map((category) => (
            <CategoryButton
              category={category}
              isActive={selectedRoot?.id === category.id}
              isPending={pendingCategoryId === category.id}
              key={category.id}
              onClick={() => goToCategory(category.id)}
            />
          ))}
        </div>
      ) : null}

      {treeLevels.length ? (
        <div className={styles.treeShell}>
          <MeasuredCategoryTree
            levels={treeLevels}
            onSelect={goToCategory}
            pendingCategoryId={pendingCategoryId}
            selectedPathIds={selectedPathIds}
          />
        </div>
      ) : null}

      {!levels.length ? (
        <p className={styles.empty}>No hay categorias activas para filtrar.</p>
      ) : null}
    </section>
  );
}

function MeasuredCategoryTree({
  levels,
  onSelect,
  pendingCategoryId,
  selectedPathIds
}: {
  levels: Array<{ categories: CategoryNodeRow[]; parentId: string | null }>;
  onSelect: (categoryId: string) => void;
  pendingCategoryId: string | null;
  selectedPathIds: Set<string>;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(1);
  const [nodeSizes, setNodeSizes] = useState<
    Map<string, { height: number; width: number }>
  >(() => new Map());
  const levelKeys = useMemo(
    () =>
      levels.map(
        (level, index) =>
          `${index}:${level.parentId ?? "root"}:${level.categories
            .map((category) => category.id)
            .join(",")}`
      ),
    [levels]
  );
  const categoryIds = useMemo(
    () =>
      levels.flatMap((level) =>
        level.categories.map((category) => category.id)
      ),
    [levels]
  );
  const hasMeasuredAllNodes = categoryIds.every((categoryId) =>
    nodeSizes.has(categoryId)
  );
  const layout = useMemo<CategoryConnectorLayout | null>(() => {
    if (!hasMeasuredAllNodes || containerWidth <= 1) {
      return null;
    }

    return buildCategoryConnectorLayout({
      containerWidth,
      levels: levels.map((level) => ({
        categories: level.categories.map((category) => {
          const size = nodeSizes.get(category.id);

          return {
            height: size?.height ?? 38,
            id: category.id,
            width: size?.width ?? 72
          };
        }),
        parentId: level.parentId
      }))
    });
  }, [containerWidth, hasMeasuredAllNodes, levels, nodeSizes]);
  const layoutNodesById = useMemo(
    () => new Map((layout?.nodes ?? []).map((node) => [node.id, node])),
    [layout]
  );

  const setNodeRef = useCallback(
    (categoryId: string) => (element: HTMLButtonElement | null) => {
      if (!element) {
        return;
      }

      const width = Math.ceil(element.offsetWidth);
      const height = Math.ceil(element.offsetHeight);

      setNodeSizes((current) => {
        const previous = current.get(categoryId);

        if (previous?.width === width && previous.height === height) {
          return current;
        }

        const next = new Map(current);
        next.set(categoryId, { height, width });
        return next;
      });
    },
    []
  );

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const updateWidth = () => {
      setContainerWidth(Math.max(1, Math.round(container.clientWidth)));
    };
    const resizeObserver = new ResizeObserver(updateWidth);

    updateWidth();
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={styles.tree}
      initial={{ opacity: 0, y: 4 }}
      ref={containerRef}
      style={
        {
          "--tree-layout-height": `${layout?.height ?? 132}px`
        } as CSSProperties
      }
      transition={treeTransition}
      aria-label="Arbol de subcategorias"
    >
      {layout ? (
        <motion.svg
          className={styles.treeConnectors}
          height={layout.height}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.16 }}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          aria-hidden="true"
        >
          {layout.connectorGroups.slice(1).map((group) => (
            <ConnectorGroupPath group={group} key={group.id} />
          ))}
        </motion.svg>
      ) : null}

      <div className={styles.treeLevels}>
        {levels.map((level, index) => {
          const levelKey =
            levelKeys[index] ?? `${level.parentId ?? "root"}-${index}`;
          return (
            <div
              className={styles.treeLevel}
              key={levelKey}
            >
              {level.categories.map((category) => (
                <TreeCategoryButton
                  category={category}
                  isReady={Boolean(layout)}
                  key={category.id}
                  layoutNode={layoutNodesById.get(category.id) ?? null}
                  onSelect={onSelect}
                  pendingCategoryId={pendingCategoryId}
                  selectedPathIds={selectedPathIds}
                  setNodeRef={setNodeRef(category.id)}
                />
              ))}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

function ConnectorGroupPath({ group }: { group: ConnectorGroup }) {
  const childXs = group.children.map((child) => child.x);
  const minX = Math.min(group.parent.x, ...childXs);
  const maxX = Math.max(group.parent.x, ...childXs);
  const railY = group.railY;

  return (
    <g>
      <path
        d={`M ${group.parent.x} ${group.parent.y} V ${railY}`}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
      {minX !== maxX ? (
        <path
          d={`M ${minX} ${railY} H ${maxX}`}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      ) : null}
      {group.children.map((child) => (
        <path
          d={`M ${child.x} ${railY} V ${child.y}`}
          fill="none"
          key={child.id}
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      ))}
    </g>
  );
}

function TreeCategoryButton({
  category,
  isReady,
  layoutNode,
  onSelect,
  pendingCategoryId,
  selectedPathIds,
  setNodeRef,
}: {
  category: CategoryNodeRow;
  isReady: boolean;
  layoutNode: CategoryLayoutNode | null;
  onSelect: (categoryId: string) => void;
  pendingCategoryId: string | null;
  selectedPathIds: Set<string>;
  setNodeRef: (element: HTMLButtonElement | null) => void;
}) {
  const isRoot = layoutNode?.levelIndex === 0;

  return (
    <motion.div
      animate={{
        left: layoutNode?.left ?? 0,
        opacity: isReady ? 1 : 0,
        top: layoutNode?.top ?? 0,
        y: isReady ? 0 : 4
      }}
      className={styles.treeNodeSlot}
      initial={{
        left: layoutNode?.left ?? 0,
        opacity: 0,
        top: layoutNode?.top ?? 0,
        y: 4
      }}
      style={{
        pointerEvents: isReady ? "auto" : "none"
      }}
      transition={treeTransition}
    >
      <CategoryButton
        category={category}
        isActive={selectedPathIds.has(category.id)}
        isRootNode={isRoot}
        isTreeNode
        isPending={pendingCategoryId === category.id}
        onClick={() => onSelect(category.id)}
        ref={setNodeRef}
      />
    </motion.div>
  );
}

function CategoryButton({
  category,
  isActive,
  isRootNode = false,
  isTreeNode = false,
  isPending,
  onClick,
  ref
}: {
  category: CategoryNodeRow;
  isActive: boolean;
  isRootNode?: boolean;
  isTreeNode?: boolean;
  isPending: boolean;
  onClick: () => void;
  ref?: (element: HTMLButtonElement | null) => void;
}) {
  return (
    <motion.button
      animate="visible"
      className={[
        styles.categoryChip,
        isTreeNode ? styles.treeCategoryChip : "",
        isRootNode ? styles.rootTreeChip : "",
        isActive ? styles.categoryChipSelected : "",
        isPending ? styles.categoryChipPending : ""
      ]
        .filter(Boolean)
        .join(" ")}
      initial="hidden"
      onClick={onClick}
      ref={ref}
      transition={chipTransition}
      type="button"
      variants={{
        hidden: { opacity: 0, scale: 0.98, y: 2 },
        visible: { opacity: 1, scale: 1, y: 0 }
      }}
      whileHover={{ y: -1 }}
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
