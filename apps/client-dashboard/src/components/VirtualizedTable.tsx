import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReactNode } from "react";

type Column<T> = {
  header: string;
  width?: string;
  cell: (row: T) => ReactNode;
};

type VirtualizedTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  height?: number;
  rowHeight?: number;
};

export function DataTable<T>({
  columns,
  rows,
  height = 520,
  rowHeight = 52,
}: VirtualizedTableProps<T>) {
  return (
    <div className="rounded-lg border bg-card overflow-auto relative" style={{ height }}>
      <Table>
        <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
          <TableRow>
            {columns.map((column, index) => (
              <TableHead key={index} style={{ width: column.width }}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                className="text-center text-muted-foreground py-8"
                colSpan={columns.length}
              >
                No records found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, rowIndex) => (
              <TableRow key={rowIndex} style={{ height: rowHeight }}>
                {columns.map((column, columnIndex) => (
                  <TableCell key={columnIndex}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable as VirtualizedTable };
