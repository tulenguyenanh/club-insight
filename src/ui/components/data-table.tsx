import type { ReactNode } from "react";

export interface Column<Row> {
  header: string;
  cell: (row: Row) => ReactNode;
  align?: "left" | "right";
  /** Hidden on narrow screens; keep the essentials visible on a phone. */
  hideOnMobile?: boolean;
}

interface DataTableProps<Row> {
  caption: string;
  columns: readonly Column<Row>[];
  rows: readonly Row[];
  rowKey: (row: Row) => string;
  empty?: ReactNode;
}

/** A plain, accessible table. Each screen describes its columns; the table only lays them out. */
export function DataTable<Row>({ caption, columns, rows, rowKey, empty }: DataTableProps<Row>) {
  if (rows.length === 0 && empty) return <>{empty}</>;

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-full border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-left text-xs font-medium text-muted">
            {columns.map((column) => (
              <th key={column.header} scope="col" className={cellClass(column, "py-2")}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-line last:border-0 hover:bg-accent-wash">
              {columns.map((column) => (
                <td key={column.header} className={cellClass(column, "py-2.5")}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function cellClass<Row>(column: Column<Row>, padding: string): string {
  return [
    padding,
    "px-5 first:pl-5 align-top",
    column.align === "right" ? "text-right tabular" : "text-left",
    column.hideOnMobile ? "hidden sm:table-cell" : "",
  ].join(" ");
}
