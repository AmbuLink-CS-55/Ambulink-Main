import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getDispatcherId } from "@/lib/identity";
import { getAnalyticsReportDownloadUrl } from "@/services/analytics.service";

type TimeRangeKey = "all" | "24h" | "7d" | "30d" | "custom";
type ReportKind = "bookings" | "driver-performance";

const TIME_RANGE_OPTIONS = [
  { label: "All time", value: "all" },
  { label: "Last 24h", value: "24h" },
  { label: "Last 7d", value: "7d" },
  { label: "Last 30d", value: "30d" },
  { label: "Custom", value: "custom" },
] satisfies ReadonlyArray<{ label: string; value: TimeRangeKey }>;

const REPORT_KIND_OPTIONS = [
  { label: "Bookings", value: "bookings" },
  { label: "Driver performance", value: "driver-performance" },
] satisfies ReadonlyArray<{ label: string; value: ReportKind }>;

function toIsoOrUndefined(value: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString();
}

function resolveRange(range: TimeRangeKey, customFrom: string, customTo: string) {
  if (range === "all") return { from: undefined, to: undefined };

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

export default function AnalyticsReportsPage() {
  const dispatcherId = getDispatcherId();

  const [range, setRange] = useState<TimeRangeKey>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [reportKind, setReportKind] = useState<ReportKind>("bookings");
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedRange = useMemo(
    () => resolveRange(range, customFrom, customTo),
    [range, customFrom, customTo]
  );

  const onDownload = async () => {
    setDownloading(true);
    setError(null);
    try {
      const url = getAnalyticsReportDownloadUrl({
        dispatcherId,
        from: resolvedRange.from,
        to: resolvedRange.to,
      });
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Report generation failed.");
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `analytics-${reportKind}-report.pdf`;
      link.click();
      URL.revokeObjectURL(objectUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to generate report.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Analytics Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate PDF reports for booking trends and driver performance.
        </p>
      </div>

      <div className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] p-4">
        <div className="grid gap-3 md:grid-cols-5">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Report type</label>
            <Select
              value={reportKind}
              onChange={(event) => setReportKind(event.target.value as ReportKind)}
              options={REPORT_KIND_OPTIONS}
            />
          </div>
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

        <div className="mt-4 flex items-center gap-3">
          <Button onClick={() => void onDownload()} disabled={downloading}>
            {downloading ? "Generating..." : "Generate PDF"}
          </Button>
          {error ? <span className="text-sm text-destructive">{error}</span> : null}
        </div>
      </div>
    </div>
  );
}
