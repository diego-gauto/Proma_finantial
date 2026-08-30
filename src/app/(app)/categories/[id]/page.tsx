import { notFound } from "next/navigation";

import { DocumentsTable } from "@/components/documents/DocumentsTable";
import { PaymentRuleForm } from "@/components/payment-rules/PaymentRuleForm";
import { PaymentRuleHistory } from "@/components/payment-rules/PaymentRuleHistory";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { listDocuments } from "@/db/documents.repository";
import { listPaymentRules } from "@/db/payment-rules.repository";
import {
  getCategoryBreadcrumbs,
  getDescendantCategoryIds
} from "@/server/categories/category-tree";
import { getCategorySummaries } from "@/server/categories/category-summary";
import { resolveApplicableRule } from "@/server/compliance/resolve-rule";
import { buildDocumentTableRows } from "@/server/documents/document-display";

import {
  closePaymentRuleAction,
  createPaymentRuleAction
} from "./rules/actions";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CategoryDetailPage({
  params
}: CategoryDetailPageProps) {
  const { id } = await params;
  const [categories, rules] = await Promise.all([
    listCategoryNodes(),
    listPaymentRules()
  ]);
  const category = categories.find((item) => item.id === id);

  if (!category) {
    notFound();
  }

  const categoryIds = getDescendantCategoryIds(categories, id);
  const documents = await listDocuments({
    filters: { categoryIds },
    limit: 250
  });
  const summaries = getCategorySummaries(categories, documents);
  const summary = summaries.get(id) ?? {
    descendantDocumentCount: documents.length,
    directDocumentCount: documents.filter((document) => document.categoryNodeId === id).length
  };
  const ownRules = rules.filter((rule) => rule.categoryNodeId === id);
  const inheritedRule = resolveApplicableRule(
    categories,
    rules,
    id,
    new Date().toISOString().slice(0, 7)
  );
  const breadcrumbs = getCategoryBreadcrumbs(categories, id);

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>{category.name}</h1>
          <p>{breadcrumbs.join(" / ")}</p>
        </div>
        <Button href={`/documents?categoryId=${category.id}`}>
          Ver documentos filtrados
        </Button>
      </div>

      <section className={styles.summaryGrid}>
        <div className={styles.metric}>
          <span>Documentos directos</span>
          <strong>{summary.directDocumentCount}</strong>
        </div>
        <div className={styles.metric}>
          <span>Con descendientes</span>
          <strong>{summary.descendantDocumentCount}</strong>
        </div>
        <div className={styles.metric}>
          <span>Reglas propias</span>
          <strong>{ownRules.length}</strong>
        </div>
        <div className={styles.metric}>
          <span>Estado</span>
          <strong>{category.active ? "Activa" : "Inactiva"}</strong>
        </div>
      </section>

      <section className={styles.rulesGrid}>
        <Card title="Historial de reglas">
          {inheritedRule && inheritedRule.categoryNodeId !== id ? (
            <p className="muted">
              Regla heredada vigente: {inheritedRule.name}
            </p>
          ) : null}
          <PaymentRuleHistory
            action={closePaymentRuleAction}
            categoryNodeId={id}
            rules={ownRules}
          />
        </Card>
        <Card title="Nueva regla de pago">
          <PaymentRuleForm action={createPaymentRuleAction} category={category} />
        </Card>
      </section>

      <Card title="Documentos de la categoria y descendientes">
        <DocumentsTable rows={buildDocumentTableRows(categories, documents)} />
      </Card>
    </div>
  );
}
