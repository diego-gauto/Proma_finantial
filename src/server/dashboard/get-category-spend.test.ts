import { describe, expect, it } from "vitest";

import { getCategorySpend } from "./get-category-spend";
import type { CategoryNodeRow, DocumentRow } from "@/db/types";

const categories: CategoryNodeRow[] = [
  {
    id: "services",
    parentId: null,
    name: "Servicios",
    active: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  },
  {
    id: "phone",
    parentId: "services",
    name: "Telefonia",
    active: true,
    sortOrder: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z"
  }
];

const documentBase: DocumentRow = {
  id: "doc-1",
  driveFileId: null,
  driveUrl: null,
  fileName: null,
  drivePath: null,
  categoryNodeId: "phone",
  paymentDate: "2026-02-10",
  paymentTime: null,
  fiscalPeriod: "2026-01",
  fiscalPeriodKind: "month",
  amount: "1000.50",
  currency: "ARS",
  reason: "Telefono",
  reference: null,
  issuer: null,
  payee: null,
  userNote: null,
  rawText: null,
  extractedData: null,
  processingStatus: "processed",
  processingError: null,
  createdAt: "2026-02-10T00:00:00.000Z",
  updatedAt: "2026-02-10T00:00:00.000Z"
};

describe("getCategorySpend", () => {
  it("groups processed document amounts by root category", () => {
    expect(
      getCategorySpend(categories, [
        documentBase,
        { ...documentBase, id: "doc-2", amount: "500" },
        { ...documentBase, id: "doc-3", processingStatus: "review_required" }
      ])
    ).toEqual({
      totalAmount: 1500.5,
      items: [
        {
          categoryId: "services",
          categoryName: "Servicios",
          amount: 1500.5,
          percentage: 100,
          paymentCount: 2
        }
      ]
    });
  });
});
