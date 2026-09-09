export interface CategoryLayoutItem {
  height: number;
  id: string;
  width: number;
}

export interface CategoryLayoutLevel {
  categories: CategoryLayoutItem[];
  parentId: string | null;
}

export interface CategoryLayoutNode extends CategoryLayoutItem {
  centerX: number;
  left: number;
  levelIndex: number;
  top: number;
}

export interface ConnectorPoint {
  id: string;
  x: number;
  y: number;
}

export interface ConnectorGroup {
  children: ConnectorPoint[];
  id: string;
  levelIndex: number;
  parent: {
    x: number;
    y: number;
  };
  railY: number;
}

export interface CategoryConnectorLayout {
  connectorGroups: ConnectorGroup[];
  height: number;
  nodes: CategoryLayoutNode[];
  width: number;
}

interface BuildCategoryConnectorLayoutInput {
  centerX?: number;
  containerWidth: number;
  firstLevelTop?: number;
  levelGap?: number;
  levels: CategoryLayoutLevel[];
  rootParentY?: number;
}

const defaultNodeHeight = 38;

export function buildCategoryConnectorLayout({
  centerX,
  containerWidth,
  firstLevelTop = 56,
  levelGap = 56,
  levels,
  rootParentY = -18
}: BuildCategoryConnectorLayoutInput): CategoryConnectorLayout {
  const width = Math.max(1, Math.round(containerWidth));
  const nodes: CategoryLayoutNode[] = [];
  const connectorGroups: ConnectorGroup[] = [];
  const nodesById = new Map<string, CategoryLayoutNode>();

  for (const [levelIndex, level] of levels.entries()) {
    const parentNode = level.parentId ? nodesById.get(level.parentId) : null;
    const parentX = parentNode?.centerX ?? centerX ?? width / 2;
    const parentY =
      parentNode ? parentNode.top + parentNode.height : rootParentY;
    const rowWidth = getRowWidth(level.categories);
    const rowLeft = clamp(parentX - rowWidth / 2, 0, Math.max(0, width - rowWidth));
    const top =
      levelIndex === 0
        ? firstLevelTop
        : Math.max(...nodes.map((node) => node.top + node.height), firstLevelTop) +
          levelGap;
    let cursor = rowLeft;
    const levelNodes: CategoryLayoutNode[] = [];

    for (const category of level.categories) {
      const node = {
        ...category,
        centerX: cursor + category.width / 2,
        height: category.height || defaultNodeHeight,
        left: cursor,
        levelIndex,
        top,
        width: category.width
      };

      levelNodes.push(node);
      nodes.push(node);
      nodesById.set(node.id, node);
      cursor += category.width + 8;
    }

    if (levelNodes.length) {
      const childTop = top;
      const railY = parentY + Math.max(16, (childTop - parentY) / 2);

      connectorGroups.push({
        children: levelNodes.map((node) => ({
          id: node.id,
          x: node.centerX,
          y: node.top
        })),
        id: `${level.parentId ?? "root"}-${levelIndex}`,
        levelIndex,
        parent: {
          x: parentX,
          y: parentY
        },
        railY
      });
    }
  }

  return {
    connectorGroups,
    height: Math.max(
      1,
      Math.ceil(Math.max(...nodes.map((node) => node.top + node.height), firstLevelTop))
    ),
    nodes,
    width
  };
}

export function getStableConnectorGroups(
  nextGroups: ConnectorGroup[],
  previousGroups: ConnectorGroup[]
): ConnectorGroup[] {
  return sameConnectorGroups(nextGroups, previousGroups)
    ? previousGroups
    : nextGroups;
}

export function sameConnectorGroups(
  first: ConnectorGroup[],
  second: ConnectorGroup[]
): boolean {
  return (
    first.length === second.length &&
    first.every((group, groupIndex) => {
      const other = second[groupIndex];

      return (
        Boolean(other) &&
        group.id === other.id &&
        group.levelIndex === other.levelIndex &&
        Math.abs(group.railY - other.railY) < 1 &&
        samePoint(group.parent, other.parent) &&
        group.children.length === other.children.length &&
        group.children.every((child, childIndex) => {
          const otherChild = other.children[childIndex];

          return (
            Boolean(otherChild) &&
            child.id === otherChild.id &&
            samePoint(child, otherChild)
          );
        })
      );
    })
  );
}

function getRowWidth(categories: CategoryLayoutItem[]): number {
  return categories.reduce(
    (total, category, index) => total + category.width + (index > 0 ? 8 : 0),
    0
  );
}

function samePoint(
  first: { x: number; y: number },
  second: { x: number; y: number }
): boolean {
  return Math.abs(first.x - second.x) < 1 && Math.abs(first.y - second.y) < 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
