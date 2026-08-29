import { describe, expect, it } from "vitest";

import type { CategoryNodeRow, DocumentRow } from "@/db/types";

import { buildDocumentTableRows, getDocumentEntity } from "./document-display";

const categoryBase: Omit<CategoryNodeRow, "id" | "name" | "parentId"> = {
  active: true,
  createdAt: "2026-08-01T00:00:00.000Z",
  sortOrder: 0,
  updatedAt: "2026-08-01T00:00:00.000Z"
};

const documentBase: DocumentRow = {
  amount: "1234.50",
  categoryNodeId: "2",
  createdAt: "2026-08-01T00:00:00.000Z",
  currency: "ARS",
  driveFileId: null,
  drivePath: null,
  driveUrl: "https://drive.example/doc",
  extractedData: null,
  fileName: "factura.pdf",
  fiscalPeriod: "2026-08",
  fiscalPeriodKind: "month",
  id: "doc-1",
  issuer: "Edenor",
  payee: "Promatex",
  paymentDate: "2026-08-20",
  paymentTime: null,
  processingError: null,
  processingStatus: "processed",
  rawText: null,
  reason: "Servicio electrico",
  reference: "OP-1",
  updatedAt: "2026-08-01T00:00:00.000Z",
  userNote: null
};

describe("document-display", () => {
  it("builds table rows with category breadcrumbs and document links", () => {
    const rows = buildDocumentTableRows(
      [
        { ...categoryBase, id: "1", name: "Servicios", parentId: null },
        { ...categoryBase, id: "2", name: "Luz", parentId: "1" }
      ],
      [documentBase]
    );

    expect(rows[0]).toMatchObject({
      amountLabel: "$ 1.234,50",
      categoryLabel: "Servicios / Luz",
      detailHref: "/documents/doc-1",
      entity: "Edenor",
      reviewHref: null
    });
  });

  it("uses payee as entity when issuer is missing", () => {
    expect(getDocumentEntity({ ...documentBase, issuer: null })).toBe(
      "Promatex"
    );
  });
});
