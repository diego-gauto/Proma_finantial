import Link from "next/link";

import type { CategoryTreeNode } from "@/server/categories/category-tree";
import type { CategoryRuleSummary } from "@/server/categories/category-rule-summary";

import styles from "./CategoryNodeSummary.module.css";

interface CategoryNodeSummaryProps {
  node: CategoryTreeNode;
  ruleSummary?: CategoryRuleSummary;
}

export function CategoryNodeSummary({
  node,
  ruleSummary
}: CategoryNodeSummaryProps) {
  const ruleType = ruleSummary?.type ?? "none";

  return (
    <div className={styles.summary}>
      <div>
        <Link href={`/categories/${node.id}`}>{node.name}</Link>
        <div className={styles.ruleMeta}>
          <span className={`${styles.rule} ${styles[ruleType]}`}>
            {ruleSummary?.label ?? "Sin regla vigente"}
          </span>
          <Link className={styles.ruleAction} href={`/categories/${node.id}`}>
            Editar reglas
          </Link>
        </div>
      </div>
      {!node.active ? <span className={styles.status}>Inactiva</span> : null}
    </div>
  );
}
