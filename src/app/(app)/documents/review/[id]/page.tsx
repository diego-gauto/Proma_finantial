import { notFound } from "next/navigation";

import { DocumentPreviewPane } from "@/components/documents/DocumentPreviewPane";
import { DocumentReviewForm } from "@/components/documents/DocumentReviewForm";
import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { getDocumentById } from "@/db/documents.repository";

import { reviewDocumentAction } from "./actions";

import styles from "@/components/documents/DocumentReview.module.css";

export const dynamic = "force-dynamic";

interface ReviewDocumentPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReviewDocumentPage({
  params
}: ReviewDocumentPageProps) {
  const { id } = await params;
  const [categories, document] = await Promise.all([
    listCategoryNodes(),
    getDocumentById(id)
  ]);

  if (!document) {
    notFound();
  }

  return (
    <div className={styles.split}>
      <Card title="Vista del documento">
        <DocumentPreviewPane document={document} />
      </Card>
      <Card title="Correccion operativa">
        <DocumentReviewForm
          action={reviewDocumentAction}
          categories={categories}
          document={document}
        />
      </Card>
    </div>
  );
}
