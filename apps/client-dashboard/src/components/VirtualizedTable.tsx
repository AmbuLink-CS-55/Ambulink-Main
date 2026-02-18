import { useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";

type Column<T> = {
  header: string;
  width?: string;
  cell: (row: T) => ReactNode;
};

type VirtualizedTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowHeight?: number;
  height?: number;
  keyFn: (row: T, index: number) => string;
};

export function VirtualizedTable<T>({
  columns,
  rows,
  rowHeight = 52,
  height = 520,
  keyFn,
}: VirtualizedTableProps<T>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = rows.length * rowHeight;
  const overscan = 6;
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visibleCount = Math.ceil(height / rowHeight) + overscan * 2;
  const endIndex = Math.min(rows.length - 1, startIndex + visibleCount - 1);

  const visibleRows = useMemo(
    () => rows.slice(startIndex, endIndex + 1),
    [rows, startIndex, endIndex]
  );

  const topSpacer = startIndex * rowHeight;
  const bottomSpacer = Math.max(0, totalHeight - (endIndex + 1) * rowHeight);

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.header} style={{ width: column.width }}>
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
      </Table>
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ maxHeight: height }}
        onScroll={(event) => setScrollTop(event.currentTarget.scrollTop)}
      >
        <Table>
          <TableBody>
            {topSpacer > 0 && (
              <TableRow style={{ height: topSpacer }}>
                <TableCell colSpan={columns.length} />
              </TableRow>
            )}
            {visibleRows.map((row, index) => (
              <TableRow key={keyFn(row, startIndex + index)} style={{ height: rowHeight }}>
                {columns.map((column) => (
                  <TableCell key={column.header}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            ))}
            {bottomSpacer > 0 && (
              <TableRow style={{ height: bottomSpacer }}>
                <TableCell colSpan={columns.length} />
              </TableRow>
            )}
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columns.length}>
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No records found.
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
