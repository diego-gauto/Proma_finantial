import Link from "next/link";

import type { CategoryTreeNode } from "@/server/categories/category-tree";
import type { CategorySummary } from "@/server/categories/category-summary";

import styles from "./CategoryNodeSummary.module.css";

interface CategoryNodeSummaryProps {
  node: CategoryTreeNode;
  summary: CategorySummary;
}

export function CategoryNodeSummary({
  node,
  summary
}: CategoryNodeSummaryProps) {
  return (
    <div className={styles.summary}>
      <div>
        <Link href={`/categories/${node.id}`}>{node.name}</Link>
        <div className={styles.meta}>
          <span>{summary.directDocumentCount} directos</span>
          <span>{summary.descendantDocumentCount} con descendientes</span>
          <span>{node.children.length} subcategorias</span>
        </div>
      </div>
      <span className={`${styles.status} ${node.active ? "" : styles.inactive}`}>
        {node.active ? "Activa" : "Inactiva"}
      </span>
    </div>
  );
}
