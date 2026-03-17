import type { DriverResponseMetricRow } from "@ambulink/types";

export type TimeRangeKey = "all" | "24h" | "7d" | "30d" | "custom";
export type ZoneClusterProperties = {
  key: string;
  count: number;
};
export type DriverSortKey =
  | "totalBookings"
  | "completionRate"
  | "cancellationRate"
  | "dispatchLatency"
  | "responseTime"
  | "onSceneTime"
  | "transportTime"
  | "endToEndTime";

export const TIME_RANGE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
  { label: "Custom", value: "custom" },
] satisfies ReadonlyArray<{ label: string; value: TimeRangeKey }>;

export const DRIVER_SORT_OPTIONS = [
  { label: "Total bookings", value: "totalBookings" },
  { label: "Completion rate", value: "completionRate" },
  { label: "Cancellation rate", value: "cancellationRate" },
  { label: "Dispatch latency", value: "dispatchLatency" },
  { label: "Response time", value: "responseTime" },
  { label: "On-scene time", value: "onSceneTime" },
  { label: "Transport time", value: "transportTime" },
  { label: "End-to-end time", value: "endToEndTime" },
] satisfies ReadonlyArray<{ label: string; value: DriverSortKey }>;

function toIsoOrUndefined(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

export function resolveRange(range: TimeRangeKey, customFrom: string, customTo: string) {
  if (range === "all") {
    return { from: undefined, to: undefined };
  }

  if (range === "custom") {
    return {
      from: toIsoOrUndefined(customFrom),
      to: toIsoOrUndefined(customTo),
    };
  }

  const now = Date.now();
  const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;

  return {
    from: new Date(now - hours * 60 * 60 * 1000).toISOString(),
    to: new Date(now).toISOString(),
  };
}

export function formatSeconds(value: number | null) {
  if (value === null) return "-";
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

export function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

export function toMetricValue(row: DriverResponseMetricRow, sortBy: DriverSortKey) {
  if (sortBy === "dispatchLatency") return row.dispatchLatency.medianSeconds ?? -1;
  if (sortBy === "responseTime") return row.responseTime.medianSeconds ?? -1;
  if (sortBy === "onSceneTime") return row.onSceneTime.medianSeconds ?? -1;
  if (sortBy === "transportTime") return row.transportTime.medianSeconds ?? -1;
  if (sortBy === "endToEndTime") return row.endToEndTime.medianSeconds ?? -1;
  return row[sortBy];
}
