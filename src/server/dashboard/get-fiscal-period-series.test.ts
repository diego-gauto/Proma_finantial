import { describe, expect, it } from "vitest";

import type { DocumentRow } from "@/db/types";

import { getFiscalPeriodSeries } from "./get-fiscal-period-series";

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

describe("getFiscalPeriodSeries", () => {
  it("groups processed payments by fiscal period instead of payment month", () => {
    expect(
      getFiscalPeriodSeries([
        documentBase,
        {
          ...documentBase,
          id: "doc-2",
          amount: "75",
          fiscalPeriod: "2026-01",
          paymentDate: "2026-03-12"
        },
        {
          ...documentBase,
          id: "doc-3",
          amount: "25",
          fiscalPeriod: "2026-02",
          paymentDate: "2026-02-28"
        },
        { ...documentBase, id: "doc-4", processingStatus: "error" }
      ])
    ).toEqual([
      { fiscalPeriod: "2026-01", amount: 175, paymentCount: 2 },
      { fiscalPeriod: "2026-02", amount: 25, paymentCount: 1 }
    ]);
  });

  it("counts a multi-period document once in every covered fiscal month", () => {
    expect(
      getFiscalPeriodSeries([
        {
          ...documentBase,
          fiscalPeriod: "2026-05",
          paymentDate: "2026-05-20",
          coveredFiscalMonths: [4, 5]
        }
      ])
    ).toEqual([
      { fiscalPeriod: "2026-04", amount: 100, paymentCount: 1 },
      { fiscalPeriod: "2026-05", amount: 100, paymentCount: 1 }
    ]);
  });

  it("fills every fiscal month in the selected year with zero values", () => {
    expect(
      getFiscalPeriodSeries([documentBase], { fiscalYear: "2026" })
    ).toEqual([
      { fiscalPeriod: "2026-01", amount: 100, paymentCount: 1 },
      { fiscalPeriod: "2026-02", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-03", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-04", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-05", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-06", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-07", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-08", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-09", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-10", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-11", amount: 0, paymentCount: 0 },
      { fiscalPeriod: "2026-12", amount: 0, paymentCount: 0 }
    ]);
  });
});
