import { describe, expect, it } from "vitest";

import type { CategoryNodeRow, DocumentRow } from "@/db/types";

import { getCategorySummaries } from "./category-summary";

const categoryBase: Omit<CategoryNodeRow, "id" | "name" | "parentId"> = {
  active: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  sortOrder: 0,
  updatedAt: "2026-01-01T00:00:00.000Z"
};

const documentBase: DocumentRow = {
  amount: "100",
  categoryNodeId: "child",
  createdAt: "2026-01-01T00:00:00.000Z",
  currency: "ARS",
  driveFileId: null,
  drivePath: null,
  driveUrl: null,
  extractedData: null,
  fileName: null,
  fiscalPeriod: "2026-01",
  fiscalPeriodKind: "month",
  id: "doc-1",
  issuer: null,
  payee: null,
  paymentDate: "2026-01-10",
  paymentTime: null,
  processingError: null,
  processingStatus: "processed",
  rawText: null,
  reason: "Pago",
  reference: null,
  updatedAt: "2026-01-01T00:00:00.000Z",
  userNote: null
};

describe("getCategorySummaries", () => {
  it("counts direct and descendant documents for every category", () => {
    const summaries = getCategorySummaries(
      [
        { ...categoryBase, id: "root", name: "Root", parentId: null },
        { ...categoryBase, id: "child", name: "Child", parentId: "root" },
        { ...categoryBase, id: "leaf", name: "Leaf", parentId: "child" }
      ],
      [
        documentBase,
        { ...documentBase, id: "doc-2", categoryNodeId: "leaf" },
        { ...documentBase, id: "doc-3", categoryNodeId: "root" },
        { ...documentBase, id: "doc-4", categoryNodeId: null }
      ]
    );

    expect(summaries.get("root")).toEqual({
      directDocumentCount: 1,
      descendantDocumentCount: 3
    });
    expect(summaries.get("child")).toEqual({
      directDocumentCount: 1,
      descendantDocumentCount: 2
    });
    expect(summaries.get("leaf")).toEqual({
      directDocumentCount: 1,
      descendantDocumentCount: 1
    });
  });
});
