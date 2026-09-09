import type { CSSProperties } from "react";

import { CategoryNodeSummary } from "@/components/categories/CategoryNodeSummary";
import type { CategoryTreeNode } from "@/server/categories/category-tree";
import type { CategoryRuleSummary } from "@/server/categories/category-rule-summary";

import styles from "./CategoryTree.module.css";

const nodeWidth = 280;
const minNodeHeight = 132;
const columnGap = 84;
const rowGap = 20;
const rowPadding = 16;

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  ruleSummaries: Map<string, CategoryRuleSummary>;
}

interface TreeLayoutNode {
  height: number;
  node: CategoryTreeNode;
  x: number;
  y: number;
}

interface TreeConnector {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export function CategoryTree({
  nodes,
  ruleSummaries
}: CategoryTreeProps) {
  return (
    <div className={styles.tree}>
      {nodes.map((node) => (
        <CategoryRootRow
          key={node.id}
          node={node}
          ruleSummaries={ruleSummaries}
        />
      ))}
    </div>
  );
}

function CategoryRootRow({
  node,
  ruleSummaries
}: {
  node: CategoryTreeNode;
  ruleSummaries: Map<string, CategoryRuleSummary>;
}) {
  const layout = buildHorizontalTreeLayout(node);
  const style = {
    "--tree-row-height": `${layout.height}px`,
    "--tree-row-width": `${layout.width}px`
  } as CSSProperties;

  return (
    <section className={styles.rootRow}>
      <div className={styles.rootCanvas} style={style}>
        <svg
          className={styles.connectors}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          width={layout.width}
          aria-hidden="true"
        >
          {layout.connectors.map((connector) => (
            <path
              d={buildConnectorPath(connector)}
              fill="none"
              key={`${connector.fromX}-${connector.fromY}-${connector.toX}-${connector.toY}`}
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1"
            />
          ))}
        </svg>

        {layout.nodes.map((item) => (
            <div
              className={styles.node}
              key={item.node.id}
              style={
                {
                  "--node-height": `${item.height}px`,
                  "--node-x": `${item.x}px`,
                  "--node-y": `${item.y}px`
                } as CSSProperties
              }
            >
              <CategoryNodeSummary
                node={item.node}
                ruleSummary={ruleSummaries.get(item.node.id)}
              />
            </div>
        ))}
      </div>
    </section>
  );
}

export function buildHorizontalTreeLayout(root: CategoryTreeNode): {
  connectors: TreeConnector[];
  height: number;
  nodes: TreeLayoutNode[];
  width: number;
} {
  const nodes: TreeLayoutNode[] = [];
  const connectors: TreeConnector[] = [];
  let nextLeafY = rowPadding;
  let maxDepth = 0;

  const placeNode = (node: CategoryTreeNode, depth: number): number => {
    const height = estimateNodeHeight(node);
    maxDepth = Math.max(maxDepth, depth);

    if (!node.children.length) {
      const y = nextLeafY;
      nextLeafY += height + rowGap;
      nodes.push({
        height,
        node,
        x: depth * (nodeWidth + columnGap),
        y
      });
      return y + height / 2;
    }

    const childCenters = node.children.map((child) => placeNode(child, depth + 1));
    const centerY =
      childCenters.reduce((total, center) => total + center, 0) /
      childCenters.length;
    const y = centerY - height / 2;
    const x = depth * (nodeWidth + columnGap);

    nodes.push({ height, node, x, y });

    for (const childCenterY of childCenters) {
      connectors.push({
        fromX: x + nodeWidth,
        fromY: centerY,
        toX: x + nodeWidth + columnGap,
        toY: childCenterY
      });
    }

    return centerY;
  };

  placeNode(root, 0);
  const minY = Math.min(...nodes.map((item) => item.y));

  if (minY < rowPadding) {
    const shiftY = rowPadding - minY;

    for (const item of nodes) {
      item.y += shiftY;
    }

    for (const connector of connectors) {
      connector.fromY += shiftY;
      connector.toY += shiftY;
    }
  }

  const bottom = Math.max(...nodes.map((item) => item.y + item.height));

  return {
    connectors,
    height: Math.max(rowPadding * 2 + minNodeHeight, bottom + rowPadding),
    nodes,
    width: (maxDepth + 1) * nodeWidth + maxDepth * columnGap
  };
}

function estimateNodeHeight(node: CategoryTreeNode): number {
  const contentWidth = node.active ? 260 : 196;
  const averageTitleCharWidth = 8.2;
  const titleLines = Math.max(
    1,
    Math.ceil((node.name.length * averageTitleCharWidth) / contentWidth)
  );
  const titleHeight = titleLines * 19;

  return Math.max(minNodeHeight, 22 + titleHeight + 12 + 24 + 7 + 24);
}

function buildConnectorPath(connector: TreeConnector): string {
  const midX = connector.fromX + (connector.toX - connector.fromX) / 2;

  return [
    `M ${connector.fromX} ${connector.fromY}`,
    `H ${midX}`,
    `V ${connector.toY}`,
    `H ${connector.toX}`
  ].join(" ");
}
