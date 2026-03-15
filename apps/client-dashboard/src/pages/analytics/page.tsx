import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useDashboardUrlState } from "@/hooks/use-dashboard-url-state";
import {
  useAnalyticsInsights,
  useAnalyticsResponse,
  useAnalyticsZones,
} from "@/services/analytics.service";
import { useDashboardSettingsStore } from "@/stores/dashboard-settings.store";
import { resolveMapTheme } from "@/lib/theme-mode";
import { AnalyticsResponseTab } from "@/pages/analytics/components/AnalyticsResponseTab";
import { AnalyticsZonesTab } from "@/pages/analytics/components/AnalyticsZonesTab";
import { AnalyticsInsightsTab } from "@/pages/analytics/components/AnalyticsInsightsTab";
import {
  resolveRange,
  TIME_RANGE_OPTIONS,
  type TimeRangeKey,
} from "@/pages/analytics/analytics-utils";

const TABS = [
  { value: "response", label: "Response" },
  { value: "zones", label: "Zones" },
  { value: "insights", label: "Insights" },
] as const;

export default function AnalyticsPage() {
  const themeMode = useDashboardSettingsStore((state) => state.settings.themeMode);
  const mapTheme = resolveMapTheme(themeMode);
  const { analyticsTab: tab, setAnalyticsTab, analyticsZoneLayer: zoneLayer, setAnalyticsZoneLayer } =
    useDashboardUrlState();

  const [range, setRange] = useState<TimeRangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const resolvedRange = resolveRange(range, customFrom, customTo);

  const responseQuery = useAnalyticsResponse({
    from: resolvedRange.from,
    to: resolvedRange.to,
  });
  const zonesQuery = useAnalyticsZones({
    from: resolvedRange.from,
    to: resolvedRange.to,
  });
  const insightsQuery = useAnalyticsInsights({
    from: resolvedRange.from,
    to: resolvedRange.to,
  });

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
        {tab === "response" ? <AnalyticsResponseTab data={responseQuery.data} /> : null}
        {tab === "zones" ? (
          <AnalyticsZonesTab
            mapTheme={mapTheme}
            zoneLayer={zoneLayer}
            setZoneLayer={setAnalyticsZoneLayer}
            data={zonesQuery.data}
          />
        ) : null}
        {tab === "insights" ? <AnalyticsInsightsTab data={insightsQuery.data} /> : null}
      </section>
    </div>
  );
}
