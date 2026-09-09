"use client";

import { useState } from "react";
import Link from "next/link";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  legacyCreateColumnHelper,
  type LegacyColumnDef,
  useLegacyTable
} from "@tanstack/react-table/legacy";

import type { ComplianceIssueTableRow } from "@/server/dashboard/compliance-issue-view-model";

import {
  complianceIssuePageSize,
  getComplianceIssuePagination
} from "./compliance-issue-pagination";
import styles from "./ComplianceIssueTable.module.css";

interface ComplianceIssueTableProps {
  emptyText: string;
  rows: ComplianceIssueTableRow[];
}

const columnHelper = legacyCreateColumnHelper<ComplianceIssueTableRow>();

const baseColumns = [
  columnHelper.accessor("categoryPath", {
    cell: (info) => {
      const row = info.row.original;

      return (
        <Link className={styles.locationLink} href={row.href}>
          {info.getValue().map((segment, index) => (
            <span
              className={styles[`locationLevel${Math.min(index + 1, 4)}`]}
              key={`${segment}-${index}`}
            >
              {segment}
            </span>
          ))}
        </Link>
      );
    },
    header: "Ubicacion"
  }),
  columnHelper.accessor("fiscalPeriod", {
    cell: (info) => <span className={styles.period}>{info.getValue()}</span>,
    header: "Periodo fiscal"
  }),
  columnHelper.accessor("paymentMonth", {
    cell: (info) => <span className={styles.period}>{info.getValue()}</span>,
    header: "Mes de pago"
  }),
  columnHelper.accessor("expectedPaymentDay", {
    cell: (info) => <span className={styles.day}>{info.getValue()}</span>,
    header: "Dia esperado"
  })
] as LegacyColumnDef<ComplianceIssueTableRow>[];

const duplicateColumns = [
  ...baseColumns.slice(0, 3),
  columnHelper.accessor("duplicateDocuments", {
    cell: (info) => (
      <div className={styles.duplicateStack}>
        {info.getValue().map((document) => (
          <div className={styles.duplicateDocument} key={document.id}>
            <span className={styles.duplicateDate}>{document.paymentDate}</span>
            <span className={styles.duplicateAmount}>{document.amount}</span>
            <span className={styles.duplicateFile}>{document.fileName}</span>
          </div>
        ))}
      </div>
    ),
    header: "Duplicados"
  })
] as LegacyColumnDef<ComplianceIssueTableRow>[];

const statusColumns = [
  ...baseColumns.slice(0, 3),
  columnHelper.accessor("statusMetric", {
    cell: (info) => <span className={styles.statusMetric}>{info.getValue()}</span>,
    header: "Dias"
  })
] as LegacyColumnDef<ComplianceIssueTableRow>[];

export function ComplianceIssueTable({
  emptyText,
  rows
}: ComplianceIssueTableProps) {
  const [pageIndex, setPageIndex] = useState(0);
  const { boundedPageIndex, firstRowIndex, lastRowIndex, pageCount } =
    getComplianceIssuePagination(rows.length, pageIndex);
  const visibleRows = rows.slice(firstRowIndex, lastRowIndex);
  const hasDuplicateDocuments = rows.some(
    (row) => row.duplicateDocuments.length > 0
  );
  const hasStatusMetric = rows.some((row) => row.statusMetric);
  const columns = hasDuplicateDocuments
    ? duplicateColumns
    : hasStatusMetric
      ? statusColumns
      : baseColumns;
  const table = useLegacyTable({
    columns,
    data: visibleRows,
    getCoreRowModel: getCoreRowModel()
  });

  if (!rows.length) {
    return <div className={styles.empty}>{emptyText}</div>;
  }

  return (
    <div className={styles.tableShell}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                className={
                  row.original.categoryTone === "a"
                    ? styles.categoryToneA
                    : styles.categoryToneB
                }
                key={row.id}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    data-label={getColumnHeaderLabel(
                      cell.column.columnDef.header
                    )}
                    key={cell.id}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {rows.length > complianceIssuePageSize ? (
        <div className={styles.pagination}>
          <span>
            {firstRowIndex + 1}-{lastRowIndex} de {rows.length}
          </span>
          <div className={styles.paginationActions}>
            <button
              disabled={boundedPageIndex === 0}
              onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
              type="button"
            >
              Anterior
            </button>
            <button
              disabled={boundedPageIndex >= pageCount - 1}
              onClick={() =>
                setPageIndex((current) => Math.min(pageCount - 1, current + 1))
              }
              type="button"
            >
              Siguiente
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function getColumnHeaderLabel(
  header: LegacyColumnDef<ComplianceIssueTableRow>["header"]
): string {
  return typeof header === "string" ? header : "";
}
