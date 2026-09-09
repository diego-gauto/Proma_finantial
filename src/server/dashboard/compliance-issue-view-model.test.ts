import { describe, expect, it } from "vitest";

import type { CategoryNodeRow } from "@/db/types";
import type {
  ComplianceStatus,
  ExpectedPeriod
} from "@/server/compliance/compliance-types";

import {
  buildOverdueIssueRows,
  buildDuplicateIssueRows,
  buildMissingIssueRows,
  buildUpcomingIssueRows
} from "./compliance-issue-view-model";

const categories: CategoryNodeRow[] = [
  category("1", null, "Categoria"),
  category("2", "1", "Subcategoria"),
  category("3", "2", "Nivel final")
];

const expectedPeriod: ExpectedPeriod = {
  categoryNodeId: "3",
  dueDate: "2026-06-15",
  fiscalPeriod: "2026-05",
  fiscalPeriodKind: "month",
  rule: {
    id: "rule-1",
    active: true,
    activeFrom: "2026-01-01",
    activeTo: null,
    anchorPeriodMonth: 1,
    appliesToDescendants: false,
    cadence: "monthly",
    categoryNodeId: "3",
    customPeriodMonths: null,
    fiscalPeriodKind: "month",
    graceDays: 5,
    name: "Mensual",
    notes: null,
    paymentDay: 15,
    paymentMonth: null,
    paymentMonthOffset: 1,
    paymentYearOffset: 0,
    reminderDaysBefore: 7
  }
};

describe("compliance issue view model", () => {
  it("builds missing rows with category hierarchy and expected payment date parts", () => {
    expect(buildMissingIssueRows([expectedPeriod], categories)).toEqual([
      {
        categoryPath: ["Categoria", "Subcategoria", "Nivel final"],
        categoryTone: "b",
        duplicateDocuments: [],
        expectedPaymentDay: "15",
        fiscalPeriod: "2026-05",
        href: "/?categoryId=3&fiscalPeriod=2026-05",
        id: "missing-3-2026-05-month",
        paymentMonth: "2026-06",
        documentCount: null
      }
    ]);
  });

  it("groups missing rows by category hierarchy before fiscal period", () => {
    const groupedCategories: CategoryNodeRow[] = [
      category("root-b", null, "Celulares", 3),
      category("root-a", null, "Ceibo", 2),
      category("root-c", null, "Arca", 1),
      category("child-a2", "root-a", "Gmail", 2),
      category("child-a1", "root-a", "Ft sis", 1)
    ];
    const rows = buildMissingIssueRows(
      [
        expected("root-b", "2026-01", "2026-01-10"),
        expected("child-a2", "2026-02", "2026-02-20"),
        expected("root-c", "2026-03", "2026-04-18"),
        expected("child-a1", "2026-01", "2026-01-20"),
        expected("child-a2", "2026-01", "2026-01-20")
      ],
      groupedCategories
    );

    expect(
      rows.map((row) => ({
        categoryPath: row.categoryPath,
        fiscalPeriod: row.fiscalPeriod
      }))
    ).toEqual([
      { categoryPath: ["Arca"], fiscalPeriod: "2026-03" },
      { categoryPath: ["Ceibo", "Ft sis"], fiscalPeriod: "2026-01" },
      { categoryPath: ["Ceibo", "Gmail"], fiscalPeriod: "2026-01" },
      { categoryPath: ["Ceibo", "Gmail"], fiscalPeriod: "2026-02" },
      { categoryPath: ["Celulares"], fiscalPeriod: "2026-01" }
    ]);
  });

  it("uses the matching expected period to show duplicate payment month and day", () => {
    const duplicates: ComplianceStatus["duplicates"] = [
      {
        categoryNodeId: "3",
        documents: [
          {
            amount: "1000.50",
            currency: "ARS",
            fileName: "comprobante-1.pdf",
            id: "doc-1",
            paymentDate: "2026-06-10"
          },
          {
            amount: "1100.00",
            currency: "ARS",
            fileName: "comprobante-2.pdf",
            id: "doc-2",
            paymentDate: "2026-06-12"
          }
        ],
        fiscalPeriod: "2026-05",
        fiscalPeriodKind: "month"
      }
    ];

    expect(buildDuplicateIssueRows(duplicates, [expectedPeriod], categories)).toEqual([
      {
        categoryPath: ["Categoria", "Subcategoria", "Nivel final"],
        categoryTone: "b",
        duplicateDocuments: [
          {
            amount: "ARS 1000.50",
            fileName: "comprobante-1.pdf",
            id: "doc-1",
            paymentDate: "2026-06-10"
          },
          {
            amount: "ARS 1100.00",
            fileName: "comprobante-2.pdf",
            id: "doc-2",
            paymentDate: "2026-06-12"
          }
        ],
        expectedPaymentDay: "15",
        fiscalPeriod: "2026-05",
        href: "/?categoryId=3&fiscalPeriod=2026-05",
        id: "duplicate-3-2026-05-month",
        paymentMonth: "2026-06",
        documentCount: 2
      }
    ]);
  });

  it("keeps duplicate rows usable when the expected rule is not available", () => {
    expect(
      buildDuplicateIssueRows(
        [
          {
            categoryNodeId: "404",
            documents: [
              {
                amount: null,
                currency: null,
                fileName: null,
                id: "doc-1",
                paymentDate: null
              },
              {
                amount: null,
                currency: null,
                fileName: null,
                id: "doc-2",
                paymentDate: null
              }
            ],
            fiscalPeriod: "2026-05",
            fiscalPeriodKind: "month"
          }
        ],
        [],
        categories
      )
    ).toEqual([
      {
        categoryPath: ["Categoria sin ubicar"],
        categoryTone: "b",
        duplicateDocuments: [
          {
            amount: "Sin monto",
            fileName: "Archivo sin nombre",
            id: "doc-1",
            paymentDate: "Sin fecha"
          },
          {
            amount: "Sin monto",
            fileName: "Archivo sin nombre",
            id: "doc-2",
            paymentDate: "Sin fecha"
          }
        ],
        expectedPaymentDay: "Sin regla",
        fiscalPeriod: "2026-05",
        href: "/?categoryId=404&fiscalPeriod=2026-05",
        id: "duplicate-404-2026-05-month",
        paymentMonth: "Sin regla",
        documentCount: 2
      }
    ]);
  });

  it("builds overdue rows with days overdue", () => {
    expect(
      buildOverdueIssueRows([expectedPeriod], categories, "2026-06-20")
    ).toEqual([
      {
        categoryPath: ["Categoria", "Subcategoria", "Nivel final"],
        categoryTone: "b",
        duplicateDocuments: [],
        expectedPaymentDay: "15",
        fiscalPeriod: "2026-05",
        href: "/?categoryId=3&fiscalPeriod=2026-05",
        id: "overdue-3-2026-05-month",
        paymentMonth: "2026-06",
        documentCount: null,
        statusMetric: "5 dias vencidos"
      }
    ]);
  });

  it("builds upcoming rows with days remaining", () => {
    expect(
      buildUpcomingIssueRows([expectedPeriod], categories, "2026-06-10")
    ).toEqual([
      {
        categoryPath: ["Categoria", "Subcategoria", "Nivel final"],
        categoryTone: "b",
        duplicateDocuments: [],
        expectedPaymentDay: "15",
        fiscalPeriod: "2026-05",
        href: "/?categoryId=3&fiscalPeriod=2026-05",
        id: "upcoming-3-2026-05-month",
        paymentMonth: "2026-06",
        documentCount: null,
        statusMetric: "5 dias faltantes"
      }
    ]);
  });
});

function category(
  id: string,
  parentId: string | null,
  name: string,
  sortOrder = Number(id)
): CategoryNodeRow {
  return {
    id,
    active: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    name,
    parentId,
    sortOrder,
    updatedAt: "2026-01-01T00:00:00.000Z"
  };
}

function expected(
  categoryNodeId: string,
  fiscalPeriod: string,
  dueDate: string
): ExpectedPeriod {
  return {
    ...expectedPeriod,
    categoryNodeId,
    dueDate,
    fiscalPeriod
  };
}
