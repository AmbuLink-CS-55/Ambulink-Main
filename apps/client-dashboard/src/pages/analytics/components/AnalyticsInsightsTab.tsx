import { useMemo } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { AnalyticsInsights } from "@ambulink/types";
import { formatPercent } from "@/pages/analytics/analytics-utils";

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const width = max > 0 && count > 0 ? Math.max(2, (count / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>{count}</span>
      </div>
      <div className="h-2 rounded-full bg-muted/40">
        <div
          className="h-2 rounded-full bg-[color:var(--primary)] transition-all duration-300"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

export function AnalyticsInsightsTab({ data }: { data?: AnalyticsInsights }) {
  const funnelMax = useMemo(() => Math.max(0, ...(data?.funnel.map((item) => item.count) ?? [0])), [data?.funnel]);
  const hourlyMax = useMemo(
    () => Math.max(0, ...(data?.demandByHour.map((item) => item.count) ?? [0])),
    [data?.demandByHour]
  );
  const weekdayMax = useMemo(
    () => Math.max(0, ...(data?.demandByWeekday.map((item) => item.count) ?? [0])),
    [data?.demandByWeekday]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <h2 className="text-sm font-semibold">Status funnel</h2>
        {(data?.funnel ?? []).map((item) => (
          <BarRow
            key={item.stage}
            label={`${item.stage} (${item.percentage.toFixed(1)}%)`}
            count={item.count}
            max={funnelMax}
          />
        ))}
      </div>

      <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <h2 className="text-sm font-semibold">Cancellation reasons</h2>
        {(data?.cancellationReasons ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No cancellations for this range.</p>
        ) : (
          data?.cancellationReasons.map((item) => (
            <BarRow
              key={item.reason}
              label={`${item.reason} (${item.percentage.toFixed(1)}%)`}
              count={item.count}
              max={data?.cancellationReasons[0]?.count ?? 1}
            />
          ))
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <h2 className="text-sm font-semibold">Demand by hour (UTC)</h2>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {(data?.demandByHour ?? []).map((item) => (
            <BarRow key={item.label} label={item.label} count={item.count} max={hourlyMax} />
          ))}
        </div>
      </div>

      <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <h2 className="text-sm font-semibold">Demand by weekday (UTC)</h2>
        {(data?.demandByWeekday ?? []).map((item) => (
          <BarRow key={item.label} label={item.label} count={item.count} max={weekdayMax} />
        ))}
      </div>

      <div className="space-y-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 lg:col-span-2">
        <h2 className="text-sm font-semibold">Hospital choice ranking</h2>
        {(data?.hospitalChoices ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No hospital selection data in this range.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hospital</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(data?.hospitalChoices ?? []).map((item) => (
                <TableRow key={item.hospitalId}>
                  <TableCell>{item.hospitalName}</TableCell>
                  <TableCell>{item.count}</TableCell>
                  <TableCell>{formatPercent(item.percentage)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
