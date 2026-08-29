import { ReviewQueue } from "@/components/documents/ReviewQueue";
import { Card } from "@/components/ui/Card";
import { listCategoryNodes } from "@/db/categories.repository";
import { listReviewDocuments } from "@/db/documents.repository";
import { buildDocumentTableRows } from "@/server/documents/document-display";

export const dynamic = "force-dynamic";

export default async function ReviewDocumentsPage() {
  const [categories, documents] = await Promise.all([
    listCategoryNodes(),
    listReviewDocuments({ limit: 200 })
  ]);

  return (
    <Card title="Documentos a revisar">
      <ReviewQueue rows={buildDocumentTableRows(categories, documents)} />
    </Card>
  );
}
