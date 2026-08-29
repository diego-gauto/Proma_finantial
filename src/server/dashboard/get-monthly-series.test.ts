import { describe, expect, it } from "vitest";

import { getMonthlySeries } from "./get-monthly-series";
import type { DocumentRow } from "@/db/types";

const documentBase: DocumentRow = {
  id: "doc-1",
  driveFileId: null,
  driveUrl: null,
  fileName: null,
  drivePath: null,
  categoryNodeId: "cat-1",
  paymentDate: "2026-02-10",
  paymentTime: null,
  fiscalPeriod: "2026-01",
  fiscalPeriodKind: "month",
  amount: "100",
  currency: "ARS",
  reason: "Pago",
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

describe("getMonthlySeries", () => {
  it("groups processed payments by payment month", () => {
    expect(
      getMonthlySeries([
        documentBase,
        { ...documentBase, id: "doc-2", amount: "75" },
        { ...documentBase, id: "doc-3", paymentDate: "2026-03-02", amount: "25" },
        { ...documentBase, id: "doc-4", processingStatus: "error" }
      ])
    ).toEqual([
      {
        month: "2026-02",
        amount: 175,
        paymentCount: 2
      },
      {
        month: "2026-03",
        amount: 25,
        paymentCount: 1
      }
    ]);
  });

  it("fills every month in the selected fiscal year with zero values", () => {
    expect(
      getMonthlySeries(
        [
          documentBase,
          { ...documentBase, id: "doc-2", paymentDate: "2026-08-04", amount: "50" }
        ],
        { fiscalYear: "2026" }
      )
    ).toEqual([
      { month: "2026-01", amount: 0, paymentCount: 0 },
      { month: "2026-02", amount: 100, paymentCount: 1 },
      { month: "2026-03", amount: 0, paymentCount: 0 },
      { month: "2026-04", amount: 0, paymentCount: 0 },
      { month: "2026-05", amount: 0, paymentCount: 0 },
      { month: "2026-06", amount: 0, paymentCount: 0 },
      { month: "2026-07", amount: 0, paymentCount: 0 },
      { month: "2026-08", amount: 50, paymentCount: 1 },
      { month: "2026-09", amount: 0, paymentCount: 0 },
      { month: "2026-10", amount: 0, paymentCount: 0 },
      { month: "2026-11", amount: 0, paymentCount: 0 },
      { month: "2026-12", amount: 0, paymentCount: 0 }
    ]);
  });
});
