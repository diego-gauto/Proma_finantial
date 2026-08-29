import { z } from "zod";

import {
  getDocumentById,
  updateReviewedDocument,
  type ReviewDocumentInput
} from "@/db/documents.repository";
import type { DocumentRow } from "@/db/types";

export const reviewDocumentSchema = z.object({
  amount: z.string().trim().min(1),
  categoryNodeId: z.string().trim().min(1),
  currency: z.string().trim().min(1),
  fiscalPeriod: z.string().regex(/^\d{4}(-\d{2})?$/),
  fiscalPeriodKind: z.enum(["month", "year", "unknown"]),
  id: z.string().trim().min(1),
  issuer: z.string().trim().nullable(),
  payee: z.string().trim().nullable(),
  paymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().trim().min(1),
  reference: z.string().trim().nullable(),
  userNote: z.string().trim().nullable()
});

interface ReviewDocumentDependencies {
  getDocumentById: typeof getDocumentById;
  updateReviewedDocument: typeof updateReviewedDocument;
}

const defaultDependencies: ReviewDocumentDependencies = {
  getDocumentById,
  updateReviewedDocument
};

export async function reviewDocument(
  input: ReviewDocumentInput,
  dependencies: ReviewDocumentDependencies = defaultDependencies
): Promise<DocumentRow> {
  const parsed = reviewDocumentSchema.parse(input);
  const document = await dependencies.getDocumentById(parsed.id);

  if (!document) {
    throw new Error("Documento no encontrado.");
  }

  if (
    document.processingStatus !== "review_required" &&
    document.processingStatus !== "error"
  ) {
    throw new Error(
      "Solo los documentos pendientes de revision o con error pueden corregirse."
    );
  }

  return dependencies.updateReviewedDocument(parsed.id, parsed);
}
