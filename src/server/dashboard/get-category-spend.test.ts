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

  it("sorts root categories by amount and excludes documents without processed amounts", () => {
    const extendedCategories: CategoryNodeRow[] = [
      ...categories,
      {
        id: "taxes",
        parentId: null,
        name: "Impuestos",
        active: true,
        sortOrder: 2,
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z"
      }
    ];

    expect(
      getCategorySpend(extendedCategories, [
        documentBase,
        {
          ...documentBase,
          id: "doc-2",
          amount: "3000",
          categoryNodeId: "taxes"
        },
        {
          ...documentBase,
          id: "doc-3",
          amount: null,
          categoryNodeId: "taxes"
        },
        {
          ...documentBase,
          id: "doc-4",
          amount: "9000",
          categoryNodeId: "taxes",
          processingStatus: "error"
        }
      ])
    ).toEqual({
      totalAmount: 4000.5,
      items: [
        {
          categoryId: "taxes",
          categoryName: "Impuestos",
          amount: 3000,
          percentage: 75,
          paymentCount: 1
        },
        {
          categoryId: "services",
          categoryName: "Servicios",
          amount: 1000.5,
          percentage: 25,
          paymentCount: 1
        }
      ]
    });
  });
});
