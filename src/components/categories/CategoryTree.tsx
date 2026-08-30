import type { CSSProperties } from "react";

import { CategoryNodeSummary } from "@/components/categories/CategoryNodeSummary";
import type { CategoryTreeNode } from "@/server/categories/category-tree";
import type { CategorySummary } from "@/server/categories/category-summary";

import styles from "./CategoryTree.module.css";

interface CategoryTreeProps {
  nodes: CategoryTreeNode[];
  summaries: Map<string, CategorySummary>;
}

export function CategoryTree({ nodes, summaries }: CategoryTreeProps) {
  return (
    <div className={styles.tree}>
      {nodes.map((node) => (
        <TreeNode
          depth={0}
          key={node.id}
          node={node}
          summaries={summaries}
        />
      ))}
    </div>
  );
}

function TreeNode({
  depth,
  node,
  summaries
}: {
  depth: number;
  node: CategoryTreeNode;
  summaries: Map<string, CategorySummary>;
}) {
  const summary = summaries.get(node.id) ?? {
    descendantDocumentCount: 0,
    directDocumentCount: 0
  };
  const style = { "--depth": `${depth * 18}px` } as CSSProperties;

  if (!node.children.length) {
    return (
      <div className={`${styles.node} ${styles.leaf}`} style={style}>
        <CategoryNodeSummary node={node} summary={summary} />
      </div>
    );
  }

  return (
    <div className={styles.node} style={style}>
      <details open={depth < 1}>
        <summary className={styles.branch}>
          <span className={styles.caret}>v</span>
          <CategoryNodeSummary node={node} summary={summary} />
        </summary>
        <div className={styles.children}>
          {node.children.map((child) => (
            <TreeNode
              depth={depth + 1}
              key={child.id}
              node={child}
              summaries={summaries}
            />
          ))}
        </div>
      </details>
    </div>
  );
}
