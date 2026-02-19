import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
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

export function VirtualizedTable<T>({
  columns,
  rows,
  height = 520,
  rowHeight = 52,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Calculate spacers to simulate total height
  const paddingTop = virtualItems.length > 0 ? virtualItems[0].start : 0;
  const paddingBottom =
    virtualItems.length > 0
      ? rowVirtualizer.getTotalSize() - virtualItems[virtualItems.length - 1].end
      : 0;

  return (
    <div
      ref={parentRef}
      className="rounded-lg border bg-card overflow-auto relative"
      style={{ height }}
    >
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
          {paddingTop > 0 && (
            <TableRow>
              <TableCell style={{ height: paddingTop }} colSpan={columns.length} />
            </TableRow>
          )}
          {virtualItems.map((virtualRow) => {
            const row = rows[virtualRow.index];
            return (
              <TableRow
                key={virtualRow.key}
                style={{ height: virtualRow.size }}
                ref={rowVirtualizer.measureElement}
                data-index={virtualRow.index}
              >
                {columns.map((column, index) => (
                  <TableCell key={index}>{column.cell(row)}</TableCell>
                ))}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            <TableRow>
              <TableCell style={{ height: paddingBottom }} colSpan={columns.length} />
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
