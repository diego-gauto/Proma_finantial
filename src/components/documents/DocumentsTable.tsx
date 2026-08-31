"use client";

import Link from "next/link";
import { flexRender } from "@tanstack/react-table";
import {
  getCoreRowModel,
  legacyCreateColumnHelper,
  type LegacyColumnDef,
  useLegacyTable
} from "@tanstack/react-table/legacy";

import type { DocumentTableRow } from "@/server/documents/document-display";
import { getDocumentStatusLabel } from "@/server/documents/document-display";

import styles from "./DocumentsTable.module.css";

interface DocumentsTableProps {
  emptyText?: string;
  rows: DocumentTableRow[];
}

const columnHelper = legacyCreateColumnHelper<DocumentTableRow>();

const columns = [
  columnHelper.accessor("reason", {
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className={styles.mainCell}>
          <Link href={row.reviewHref ?? row.detailHref}>{info.getValue()}</Link>
          <span className={styles.meta}>{row.categoryLabel}</span>
          <span className={styles.meta}>{row.reference}</span>
        </div>
      );
    },
    header: "Documento"
  }),
  columnHelper.accessor("entity", {
    header: "Entidad"
  }),
  columnHelper.accessor("fiscalPeriod", {
    header: "Periodo fiscal"
  }),
  columnHelper.accessor("paymentDate", {
    header: "Fecha de pago"
  }),
  columnHelper.accessor("amountLabel", {
    cell: (info) => <span className={styles.amount}>{info.getValue()}</span>,
    header: "Monto"
  }),
  columnHelper.accessor("processingStatus", {
    cell: (info) => (
      <span className={styles.status}>
        {getDocumentStatusLabel(info.getValue())}
      </span>
    ),
    header: "Estado"
  }),
  columnHelper.display({
    cell: (info) => {
      const row = info.row.original;
      return (
        <div className={styles.actions}>
          <Link href={row.detailHref}>Detalle</Link>
          {row.reviewHref ? <Link href={row.reviewHref}>Revisar</Link> : null}
          {row.driveHref ? (
            <a href={row.driveHref} rel="noreferrer" target="_blank">
              Drive
            </a>
          ) : null}
        </div>
      );
    },
    header: "Acciones",
    id: "actions"
  })
] as LegacyColumnDef<DocumentTableRow>[];

export function DocumentsTable({
  emptyText = "No hay documentos para estos filtros.",
  rows
}: DocumentsTableProps) {
  const table = useLegacyTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel()
  });

  if (!rows.length) {
    return <div className={styles.empty}>{emptyText}</div>;
  }

  return (
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
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td
                  data-label={getColumnHeaderLabel(cell.column.columnDef.header)}
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
  );
}

function getColumnHeaderLabel(
  header: LegacyColumnDef<DocumentTableRow>["header"]
): string {
  return typeof header === "string" ? header : "";
}
