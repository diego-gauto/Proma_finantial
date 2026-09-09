import { notFound } from "next/navigation";
import Link from "next/link";

import { BackLink } from "@/components/navigation/BackLink";
import { PaymentRuleForm } from "@/components/payment-rules/PaymentRuleForm";
import { PaymentRuleHistory } from "@/components/payment-rules/PaymentRuleHistory";
import { getCurrentRule } from "@/components/payment-rules/payment-rule-presenter";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { listCategoryNodes } from "@/db/categories.repository";
import { listPaymentRules } from "@/db/payment-rules.repository";
import {
  getCategoryBreadcrumbs
} from "@/server/categories/category-tree";
import { resolveApplicableRule } from "@/server/compliance/resolve-rule";

import {
  createPaymentRuleAction,
  updatePaymentRuleAction
} from "./rules/actions";

import styles from "./page.module.css";

export const dynamic = "force-dynamic";

interface CategoryDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CategoryDetailPage({
  params,
  searchParams
}: CategoryDetailPageProps) {
  const { id } = await params;
  const rawSearchParams = await searchParams;
  const [categories, rules] = await Promise.all([
    listCategoryNodes(),
    listPaymentRules()
  ]);
  const category = categories.find((item) => item.id === id);

  if (!category) {
    notFound();
  }

  const ownRules = rules.filter((rule) => rule.categoryNodeId === id);
  const inheritedRule = resolveApplicableRule(
    categories,
    rules,
    id,
    new Date().toISOString().slice(0, 7)
  );
  const breadcrumbs = getCategoryBreadcrumbs(categories, id);
  const currentRule = getCurrentRule(ownRules);
  const hasDescendants = categories.some((item) => item.parentId === id);
  const ruleModalMode = getFirstValue(rawSearchParams.ruleModal);
  const selectedRuleId = getFirstValue(rawSearchParams.ruleId);
  const modalRule =
    ruleModalMode === "edit" && selectedRuleId
      ? ownRules.find((rule) => rule.id === selectedRuleId) ?? currentRule
      : null;
  const isRuleModalOpen = ruleModalMode === "new" || ruleModalMode === "edit";

  return (
    <div className={styles.page}>
      <BackLink href="/categories" />
      <div className={styles.header}>
        <div className={styles.titleBlock}>
          <h1>{category.name}</h1>
          {breadcrumbs.length > 1 ? (
            <p>{breadcrumbs.slice(0, -1).join(" / ")}</p>
          ) : null}
        </div>
      </div>

      <section className={styles.rulesStack}>
        <Card
          title="Historial de reglas"
          actions={
            <Button
              href={`/categories/${id}?ruleModal=new`}
              variant="primary"
            >
              Nueva regla
            </Button>
          }
        >
          {inheritedRule && inheritedRule.categoryNodeId !== id ? (
            <p className={styles.inheritedRule}>
              Hereda actualmente: {inheritedRule.name}
            </p>
          ) : null}
          <PaymentRuleHistory categoryId={id} rules={ownRules} />
        </Card>
      </section>

      {isRuleModalOpen ? (
        <div className={styles.modalBackdrop}>
          <section aria-label="Formulario de regla de pago" className={styles.ruleModal}>
            <div className={styles.modalHeader}>
              <div>
                <h2>{ruleModalMode === "edit" ? "Editar regla actual" : "Nueva regla de pago"}</h2>
                <p>{category.name}</p>
              </div>
              <Link aria-label="Cerrar formulario de regla" href={`/categories/${id}`}>
                Cerrar
              </Link>
            </div>
            <div className={styles.modalBody}>
              <PaymentRuleForm
                action={
                  ruleModalMode === "edit"
                    ? updatePaymentRuleAction
                    : createPaymentRuleAction
                }
                cancelHref={`/categories/${id}`}
                canApplyToDescendants={hasDescendants}
                category={category}
                existingRuleNames={ownRules.map((rule) => rule.name)}
                initialRule={modalRule}
                minimumActiveFromMonth={
                  ruleModalMode === "new"
                    ? getFirstDayOfNextMonth(currentRule?.activeFrom)
                    : undefined
                }
                submitLabel={
                  ruleModalMode === "edit" ? "Guardar cambios" : "Crear regla"
                }
              />
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function getFirstValue(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function getFirstDayOfNextMonth(activeFrom: string | undefined): string | undefined {
  if (!activeFrom) {
    return undefined;
  }

  const [year, month] = activeFrom.slice(0, 7).split("-").map(Number);
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}
