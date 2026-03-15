import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Map as MapView, MapClusterLayer, MapControls, MapPopup } from "@/components/ui/map";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useDashboardUrlState } from "@/hooks/use-dashboard-url-state";
import {
  useAnalyticsInsights,
  useAnalyticsResponse,
  useAnalyticsZones,
} from "@/services/analytics.service";
import { getDispatcherId } from "@/lib/identity";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";
import { resolveMapTheme } from "@/lib/theme-mode";
import type { DriverResponseMetricRow } from "@ambulink/types";

const TABS = [
  { value: "response", label: "Response" },
  { value: "zones", label: "Zones" },
  { value: "insights", label: "Insights" },
] as const;

type TimeRangeKey = "all" | "24h" | "7d" | "30d" | "custom";
type ZoneClusterProperties = {
  key: string;
  count: number;
};
type DriverSortKey =
  | "totalBookings"
  | "completionRate"
  | "cancellationRate"
  | "dispatchLatency"
  | "responseTime"
  | "onSceneTime"
  | "transportTime"
  | "endToEndTime";

const TIME_RANGE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
  { label: "Custom", value: "custom" },
] satisfies ReadonlyArray<{ label: string; value: TimeRangeKey }>;

const DRIVER_SORT_OPTIONS = [
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

function resolveRange(range: TimeRangeKey, customFrom: string, customTo: string) {
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

function formatSeconds(value: number | null) {
  if (value === null) return "-";
  if (value < 60) return `${value}s`;
  const minutes = Math.floor(value / 60);
  const seconds = value % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function toMetricValue(row: DriverResponseMetricRow, sortBy: DriverSortKey) {
  if (sortBy === "dispatchLatency") return row.dispatchLatency.medianSeconds ?? -1;
  if (sortBy === "responseTime") return row.responseTime.medianSeconds ?? -1;
  if (sortBy === "onSceneTime") return row.onSceneTime.medianSeconds ?? -1;
  if (sortBy === "transportTime") return row.transportTime.medianSeconds ?? -1;
  if (sortBy === "endToEndTime") return row.endToEndTime.medianSeconds ?? -1;
  return row[sortBy];
}

function MetricCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{value}</div>
      {sub ? <div className="mt-1 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

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

export default function AnalyticsPage() {
  const themeMode = useDashboardSettingsStore((state) => state.settings.themeMode);
  const mapTheme = resolveMapTheme(themeMode);
  const dispatcherId = getDispatcherId();
  const { analyticsTab: tab, setAnalyticsTab, analyticsZoneLayer: zoneLayer, setAnalyticsZoneLayer } =
    useDashboardUrlState();

  const [range, setRange] = useState<TimeRangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [selectedZonePoint, setSelectedZonePoint] = useState<{
    coordinates: [number, number];
    properties: ZoneClusterProperties;
  } | null>(null);
  const [selectedZoneCluster, setSelectedZoneCluster] = useState<{
    coordinates: [number, number];
    pointCount: number;
  } | null>(null);
  const [driverSortBy, setDriverSortBy] = useState<DriverSortKey>("totalBookings");
  const [sortDesc, setSortDesc] = useState(true);

  const resolvedRange = useMemo(() => resolveRange(range, customFrom, customTo), [range, customFrom, customTo]);

  const responseQuery = useAnalyticsResponse({
    dispatcherId,
    from: resolvedRange.from,
    to: resolvedRange.to,
  });

  const zonesQuery = useAnalyticsZones({
    dispatcherId,
    from: resolvedRange.from,
    to: resolvedRange.to,
  });

  const insightsQuery = useAnalyticsInsights({
    dispatcherId,
    from: resolvedRange.from,
    to: resolvedRange.to,
  });

  const drivers = useMemo(() => {
    const rows = responseQuery.data?.drivers ?? [];
    const sorted = rows.slice().sort((a, b) => {
      const aValue = toMetricValue(a, driverSortBy);
      const bValue = toMetricValue(b, driverSortBy);
      return sortDesc ? bValue - aValue : aValue - bValue;
    });
    return sorted;
  }, [responseQuery.data?.drivers, driverSortBy, sortDesc]);

  const zoneCells = useMemo(
    () =>
      zoneLayer === "origins"
        ? zonesQuery.data?.responseOrigins ?? []
        : zonesQuery.data?.hospitalDestinations ?? [],
    [zoneLayer, zonesQuery.data?.responseOrigins, zonesQuery.data?.hospitalDestinations]
  );
  const zoneClusterPoints = useMemo(
    () =>
      ({
        type: "FeatureCollection",
        features: zoneCells.flatMap((cell) => {
          // Expand each grid cell into weighted points so cluster strength reflects demand volume.
          const repeats = Math.min(30, Math.max(1, Math.round(cell.count)));
          return Array.from({ length: repeats }, () => ({
            type: "Feature",
            properties: {
              key: cell.key,
              count: cell.count,
            },
            geometry: {
              type: "Point",
              coordinates: [cell.center.x, cell.center.y],
            },
          }));
        }),
      }) as GeoJSON.FeatureCollection<
        GeoJSON.Point,
        ZoneClusterProperties
      >,
    [zoneCells]
  );

  const zoneCenter = useMemo<[number, number]>(() => {
    if (zoneCells.length === 0) return [79.87, 6.9];
    const sum = zoneCells.reduce(
      (acc, cell) => {
        acc.x += cell.center.x;
        acc.y += cell.center.y;
        return acc;
      },
      { x: 0, y: 0 }
    );
    return [sum.x / zoneCells.length, sum.y / zoneCells.length];
  }, [zoneCells]);

  const funnelMax = useMemo(
    () => Math.max(0, ...(insightsQuery.data?.funnel.map((item) => item.count) ?? [0])),
    [insightsQuery.data?.funnel]
  );
  const hourlyMax = useMemo(
    () => Math.max(0, ...(insightsQuery.data?.demandByHour.map((item) => item.count) ?? [0])),
    [insightsQuery.data?.demandByHour]
  );
  const weekdayMax = useMemo(
    () => Math.max(0, ...(insightsQuery.data?.demandByWeekday.map((item) => item.count) ?? [0])),
    [insightsQuery.data?.demandByWeekday]
  );

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-sm text-muted-foreground">Response timing, demand zones, and operational insights.</p>
        </div>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Time range</label>
            <Select
              value={range}
              onChange={(event) => setRange(event.target.value as TimeRangeKey)}
              options={TIME_RANGE_OPTIONS}
            />
          </div>
          {range === "custom" ? (
            <>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">From</label>
                <Input
                  type="datetime-local"
                  value={customFrom}
                  onChange={(event) => setCustomFrom(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted-foreground">To</label>
                <Input
                  type="datetime-local"
                  value={customTo}
                  onChange={(event) => setCustomTo(event.target.value)}
                />
              </div>
            </>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-2">
        <div className="relative grid grid-cols-3 gap-2">
          {TABS.map((item) => (
            <Button
              key={item.value}
              variant={tab === item.value ? "primary" : "ghost"}
              onClick={() => setAnalyticsTab(item.value)}
              className="w-full"
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>

      <section key={tab} className="animate-in fade-in slide-in-from-bottom-1 duration-300">
        {tab === "response" ? (
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <MetricCard
                title="Bookings"
                value={String(responseQuery.data?.totalBookings ?? 0)}
                sub="Total in selected range"
              />
              <MetricCard
                title="Completion"
                value={formatPercent(responseQuery.data?.completionRate ?? 0)}
                sub={`${responseQuery.data?.completedBookings ?? 0} completed`}
              />
              <MetricCard
                title="Cancellation"
                value={formatPercent(responseQuery.data?.cancellationRate ?? 0)}
                sub={`${responseQuery.data?.cancelledBookings ?? 0} cancelled`}
              />
              <MetricCard
                title="Dispatch latency"
                value={formatSeconds(responseQuery.data?.dispatchLatency.medianSeconds ?? null)}
                sub="Median requested -> assigned"
              />
              <MetricCard
                title="Response time"
                value={formatSeconds(responseQuery.data?.responseTime.medianSeconds ?? null)}
                sub="Median assigned -> arrived"
              />
              <MetricCard
                title="End-to-end"
                value={formatSeconds(responseQuery.data?.endToEndTime.medianSeconds ?? null)}
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
        ) : null}

        {tab === "zones" ? (
          <div className="space-y-3">
            <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant={zoneLayer === "origins" ? "primary" : "outline"}
                  onClick={() => {
                    setAnalyticsZoneLayer("origins");
                    setSelectedZonePoint(null);
                    setSelectedZoneCluster(null);
                  }}
                >
                  Response Origins
                </Button>
                <Button
                  variant={zoneLayer === "destinations" ? "primary" : "outline"}
                  onClick={() => {
                    setAnalyticsZoneLayer("destinations");
                    setSelectedZonePoint(null);
                    setSelectedZoneCluster(null);
                  }}
                >
                  Hospital Destinations
                </Button>
                <span className="ml-auto text-xs text-muted-foreground">
                  {zoneCells.length} grid cells in selected range
                </span>
              </div>
            </div>

            <div className="h-[70vh] overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--card)]">
              {zoneCells.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No zone data in this range.
                </div>
              ) : (
                <MapView theme={mapTheme} center={zoneCenter} zoom={10.5}>
                  <MapControls position="bottom-right" showZoom showLocate className="mb-4" />
                  <MapClusterLayer
                    data={zoneClusterPoints}
                    clusterRadius={50}
                    clusterMaxZoom={13}
                    clusterColors={["#1d8cf8", "#6d5dfc", "#e23670"]}
                    clusterThresholds={[8, 30]}
                    pointColor="#1d8cf8"
                    onPointClick={(feature, coordinates) => {
                      setSelectedZoneCluster(null);
                      setSelectedZonePoint({
                        coordinates,
                        properties: feature.properties,
                      });
                    }}
                    onClusterClick={(_clusterId, coordinates, pointCount) => {
                      setSelectedZonePoint(null);
                      setSelectedZoneCluster({ coordinates, pointCount });
                    }}
                  />
                  {selectedZoneCluster ? (
                    <MapPopup
                      key={`${selectedZoneCluster.coordinates[0]}-${selectedZoneCluster.coordinates[1]}-cluster`}
                      longitude={selectedZoneCluster.coordinates[0]}
                      latitude={selectedZoneCluster.coordinates[1]}
                      onClose={() => setSelectedZoneCluster(null)}
                      closeOnClick={false}
                      focusAfterOpen={false}
                      closeButton
                    >
                      <div className="space-y-1 p-1 text-xs">
                        <div className="font-semibold text-foreground">Cluster summary</div>
                        <div className="text-muted-foreground">
                          Points in cluster: {selectedZoneCluster.pointCount}
                        </div>
                      </div>
                    </MapPopup>
                  ) : null}
                  {selectedZonePoint ? (
                    <MapPopup
                      key={`${selectedZonePoint.coordinates[0]}-${selectedZonePoint.coordinates[1]}`}
                      longitude={selectedZonePoint.coordinates[0]}
                      latitude={selectedZonePoint.coordinates[1]}
                      onClose={() => setSelectedZonePoint(null)}
                      closeOnClick={false}
                      focusAfterOpen={false}
                      closeButton
                    >
                      <div className="space-y-1 p-1 text-xs">
                        <div className="font-semibold text-foreground">
                          {zoneLayer === "origins" ? "Response origin cell" : "Hospital destination cell"}
                        </div>
                        <div className="text-muted-foreground">
                          Requests in cell: {selectedZonePoint.properties.count}
                        </div>
                      </div>
                    </MapPopup>
                  ) : null}
                </MapView>
              )}
            </div>
          </div>
        ) : null}

        {tab === "insights" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <h2 className="text-sm font-semibold">Status funnel</h2>
              {(insightsQuery.data?.funnel ?? []).map((item) => (
                <BarRow key={item.stage} label={`${item.stage} (${item.percentage.toFixed(1)}%)`} count={item.count} max={funnelMax} />
              ))}
            </div>

            <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <h2 className="text-sm font-semibold">Cancellation reasons</h2>
              {(insightsQuery.data?.cancellationReasons ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No cancellations for this range.</p>
              ) : (
                insightsQuery.data?.cancellationReasons.map((item) => (
                  <BarRow key={item.reason} label={`${item.reason} (${item.percentage.toFixed(1)}%)`} count={item.count} max={insightsQuery.data?.cancellationReasons[0]?.count ?? 1} />
                ))
              )}
            </div>

            <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <h2 className="text-sm font-semibold">Demand by hour (UTC)</h2>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {(insightsQuery.data?.demandByHour ?? []).map((item) => (
                  <BarRow key={item.label} label={item.label} count={item.count} max={hourlyMax} />
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <h2 className="text-sm font-semibold">Demand by weekday (UTC)</h2>
              {(insightsQuery.data?.demandByWeekday ?? []).map((item) => (
                <BarRow key={item.label} label={item.label} count={item.count} max={weekdayMax} />
              ))}
            </div>

            <div className="space-y-3 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4 lg:col-span-2">
              <h2 className="text-sm font-semibold">Hospital choice ranking</h2>
              {(insightsQuery.data?.hospitalChoices ?? []).length === 0 ? (
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
                    {(insightsQuery.data?.hospitalChoices ?? []).map((item) => (
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
        ) : null}
      </section>
    </div>
  );
}
