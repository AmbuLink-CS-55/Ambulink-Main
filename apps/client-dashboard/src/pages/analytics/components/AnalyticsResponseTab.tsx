import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsResponse } from "@ambulink/types";
import {
  DRIVER_SORT_OPTIONS,
  formatPercent,
  formatSeconds,
  toMetricValue,
  type DriverSortKey,
} from "@/pages/analytics/analytics-utils";

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

export function AnalyticsResponseTab({ data }: { data?: AnalyticsResponse }) {
  const [driverSortBy, setDriverSortBy] = useState<DriverSortKey>("totalBookings");
  const [sortDesc, setSortDesc] = useState(true);

  const drivers = useMemo(() => {
    const rows = data?.drivers ?? [];
    return rows.slice().sort((a, b) => {
      const aValue = toMetricValue(a, driverSortBy);
      const bValue = toMetricValue(b, driverSortBy);
      return sortDesc ? bValue - aValue : aValue - bValue;
    });
  }, [data?.drivers, driverSortBy, sortDesc]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard title="Bookings" value={String(data?.totalBookings ?? 0)} sub="Total in selected range" />
        <MetricCard
          title="Completion"
          value={formatPercent(data?.completionRate ?? 0)}
          sub={`${data?.completedBookings ?? 0} completed`}
        />
        <MetricCard
          title="Cancellation"
          value={formatPercent(data?.cancellationRate ?? 0)}
          sub={`${data?.cancelledBookings ?? 0} cancelled`}
        />
        <MetricCard
          title="Dispatch latency"
          value={formatSeconds(data?.dispatchLatency.medianSeconds ?? null)}
          sub="Median requested -> assigned"
        />
        <MetricCard
          title="Response time"
          value={formatSeconds(data?.responseTime.medianSeconds ?? null)}
          sub="Median assigned -> arrived"
        />
        <MetricCard
          title="End-to-end"
          value={formatSeconds(data?.endToEndTime.medianSeconds ?? null)}
          sub="Median requested -> completed"
        />
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Per-driver metrics</h2>
          <div className="flex items-center gap-2">
            <Select
              value={driverSortBy}
              onChange={(event) => setDriverSortBy(event.target.value as DriverSortKey)}
              options={DRIVER_SORT_OPTIONS}
              className="min-w-44"
            />
            <Button variant="outline" onClick={() => setSortDesc((prev) => !prev)}>
              {sortDesc ? "Desc" : "Asc"}
            </Button>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Bookings</TableHead>
              <TableHead>Completion</TableHead>
              <TableHead>Cancellation</TableHead>
              <TableHead>Dispatch</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>On Scene</TableHead>
              <TableHead>Transport</TableHead>
              <TableHead>End-to-End</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  No driver metrics available for this range.
                </TableCell>
              </TableRow>
            ) : (
              drivers.map((row) => (
                <TableRow key={row.driverId ?? `driver-${row.driverName ?? "unknown"}`}>
                  <TableCell>{row.driverName ?? "Unassigned"}</TableCell>
                  <TableCell>{row.totalBookings}</TableCell>
                  <TableCell>{formatPercent(row.completionRate)}</TableCell>
                  <TableCell>{formatPercent(row.cancellationRate)}</TableCell>
                  <TableCell>{formatSeconds(row.dispatchLatency.medianSeconds)}</TableCell>
                  <TableCell>{formatSeconds(row.responseTime.medianSeconds)}</TableCell>
                  <TableCell>{formatSeconds(row.onSceneTime.medianSeconds)}</TableCell>
                  <TableCell>{formatSeconds(row.transportTime.medianSeconds)}</TableCell>
                  <TableCell>{formatSeconds(row.endToEndTime.medianSeconds)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
