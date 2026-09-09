import { describe, expect, it } from "vitest";

import { reviewDocument } from "./review-document";
import type { DocumentRow } from "@/db/types";

const documentBase: DocumentRow = {
  id: "doc-1",
  driveFileId: null,
  driveUrl: null,
  fileName: null,
  drivePath: null,
  categoryNodeId: "1",
  paymentDate: "2026-08-01",
  paymentTime: null,
  fiscalPeriod: "2026-08",
  fiscalPeriodKind: "month",
  amount: "100",
  currency: "ARS",
  reason: "Pago",
  reference: "REF-1",
  issuer: "Proveedor",
  payee: "Promatex",
  userNote: null,
  rawText: null,
  extractedData: null,
  processingStatus: "review_required",
  processingError: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  updatedAt: "2026-08-01T00:00:00.000Z"
};

describe("reviewDocument", () => {
  it("marks review_required documents as processed with corrected fields", async () => {
    const saved = await reviewDocument(
      {
        amount: "250.50",
        categoryNodeId: "2",
        currency: "ARS",
        fiscalPeriod: "2026-08",
        fiscalPeriodKind: "month",
        issuer: "Edenor",
        id: "doc-1",
        payee: "Promatex",
        paymentDate: "2026-08-15",
        reason: "Servicio electrico",
        reference: "OP-99",
        userNote: "Correccion manual"
      },
      {
        getDocumentById: async () => documentBase,
        updateReviewedDocument: async (_id, input) => ({
          ...documentBase,
          ...input,
          processingStatus: "processed"
        })
      }
    );

    expect(saved).toMatchObject({
      amount: "250.50",
      categoryNodeId: "2",
      fiscalPeriod: "2026-08",
      processingStatus: "processed",
      reference: "OP-99"
    });
  });

  it("passes covered fiscal months when a document pays multiple periods", async () => {
    const saved = await reviewDocument(
      {
        amount: "250.50",
        categoryNodeId: "2",
        currency: "ARS",
        coveredFiscalMonths: [4, 5],
        fiscalPeriod: "2026-05",
        fiscalPeriodKind: "month",
        issuer: "Setia",
        id: "doc-1",
        payee: "Promatex",
        paymentDate: "2026-05-15",
        reason: "Sindicatos",
        reference: "4-5-2026",
        userNote: "Cubre abril y mayo"
      },
      {
        getDocumentById: async () => documentBase,
        updateReviewedDocument: async (_id, input) => ({
          ...documentBase,
          ...input,
          processingStatus: "processed"
        })
      }
    );

    expect(saved.coveredFiscalMonths).toEqual([4, 5]);
    expect(saved.fiscalPeriod).toBe("2026-05");
  });

  it("rejects documents that are already processed", async () => {
    await expect(
      reviewDocument(
        {
          amount: "250",
          categoryNodeId: "2",
          currency: "ARS",
          fiscalPeriod: "2026-08",
          fiscalPeriodKind: "month",
          id: "doc-1",
          issuer: null,
          payee: null,
          paymentDate: "2026-08-15",
          reason: "Servicio",
          reference: null,
          userNote: null
        },
        {
          getDocumentById: async () => ({
            ...documentBase,
            processingStatus: "processed"
          }),
          updateReviewedDocument: async () => documentBase
        }
      )
    ).rejects.toThrow("Solo los documentos pendientes de revision o con error pueden corregirse.");
  });

  it("allows correcting a document without forcing a document reason", async () => {
    const saved = await reviewDocument(
      {
        amount: "250",
        categoryNodeId: "2",
        currency: "ARS",
        fiscalPeriod: "2026-08",
        fiscalPeriodKind: "month",
        id: "doc-1",
        issuer: null,
        payee: null,
        paymentDate: "2026-08-15",
        reason: null,
        reference: null,
        userNote: null
      },
      {
        getDocumentById: async () => ({ ...documentBase, reason: null }),
        updateReviewedDocument: async (_id, input) => ({
          ...documentBase,
          ...input,
          processingStatus: "processed"
        })
      }
    );

    expect(saved.processingStatus).toBe("processed");
    expect(saved.reason).toBeNull();
  });

  it("requires a fiscal period month for manual correction", async () => {
    await expect(
      reviewDocument(
        {
          amount: "250",
          categoryNodeId: "2",
          currency: "ARS",
          fiscalPeriod: "2026",
          fiscalPeriodKind: "year",
          id: "doc-1",
          issuer: null,
          payee: null,
          paymentDate: "2026-08-15",
          reason: null,
          reference: null,
          userNote: null
        },
        {
          getDocumentById: async () => documentBase,
          updateReviewedDocument: async () => documentBase
        }
      )
    ).rejects.toThrow();
  });
});
