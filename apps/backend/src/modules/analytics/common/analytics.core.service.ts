import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import type {
  AnalyticsAiResponse,
  AnalyticsInsights,
  AnalyticsResponse,
  AnalyticsZones,
  CancellationReasonMetric,
  DriverResponseMetricRow,
  FunnelStageMetric,
  HospitalChoiceMetric,
  TimeBucketMetric,
  ZoneGridCell,
} from "@ambulink/types";
import { DispatcherEventsService } from "@/modules/dispatcher/events/dispatcher.events.service";
import { AnalyticsRepository } from "./analytics.repository";
import type { AnalyticsBookingRow } from "./analytics.repository";

const ZONE_CELL_SIZE_DEGREES = 0.02;
const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type DurationBucket = {
  dispatchLatency: number[];
  responseTime: number[];
  onSceneTime: number[];
  transportTime: number[];
  endToEndTime: number[];
};

type DurationMetricSummary = DriverResponseMetricRow["dispatchLatency"];

function toSeconds(start: Date | null, end: Date | null): number | null {
  if (!start || !end) return null;
  const delta = Math.floor((end.getTime() - start.getTime()) / 1000);
  if (!Number.isFinite(delta) || delta < 0) return null;
  return delta;
}

function createDurationBucket(): DurationBucket {
  return {
    dispatchLatency: [],
    responseTime: [],
    onSceneTime: [],
    transportTime: [],
    endToEndTime: [],
  };
}

function pushDuration(value: number | null, bucket: number[]) {
  if (value === null) return;
  bucket.push(value);
}

function summarizeDurations(values: number[]): DurationMetricSummary {
  if (values.length === 0) {
    return {
      count: 0,
      averageSeconds: null,
      medianSeconds: null,
      p90Seconds: null,
      minSeconds: null,
      maxSeconds: null,
    };
  }

  const sorted = values.slice().sort((a, b) => a - b);
  const count = sorted.length;
  const sum = sorted.reduce((acc, value) => acc + value, 0);
  const middle = Math.floor(count / 2);
  const median =
    count % 2 === 0 ? Math.round((sorted[middle - 1] + sorted[middle]) / 2) : sorted[middle];
  const p90Index = Math.max(0, Math.ceil(count * 0.9) - 1);

  return {
    count,
    averageSeconds: Math.round(sum / count),
    medianSeconds: median,
    p90Seconds: sorted[p90Index],
    minSeconds: sorted[0],
    maxSeconds: sorted[count - 1],
  };
}

function rate(part: number, total: number) {
  if (total === 0) return 0;
  return Number(((part / total) * 100).toFixed(2));
}

function formatDuration(seconds: number | null) {
  if (seconds === null) return "N/A";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remMinutes = minutes % 60;
  return `${hours}h ${remMinutes}m`;
}

function toCellKey(lat: number, lng: number, cellSize: number) {
  const latIndex = Math.floor(lat / cellSize);
  const lngIndex = Math.floor(lng / cellSize);
  return {
    key: `${latIndex}:${lngIndex}`,
    center: {
      y: latIndex * cellSize + cellSize / 2,
      x: lngIndex * cellSize + cellSize / 2,
    },
  };
}

function buildZoneCells(points: Array<{ lat: number; lng: number }>, cellSize: number): ZoneGridCell[] {
  if (points.length === 0) return [];

  const counts = new Map<string, { count: number; center: { x: number; y: number } }>();

  for (const point of points) {
    const cell = toCellKey(point.lat, point.lng, cellSize);
    const existing = counts.get(cell.key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    counts.set(cell.key, { count: 1, center: cell.center });
  }

  const maxCount = Math.max(...Array.from(counts.values(), (entry) => entry.count));

  return Array.from(counts.entries())
    .map(([key, value]) => ({
      key,
      center: { x: value.center.x, y: value.center.y },
      count: value.count,
      weight: Number((value.count / maxCount).toFixed(4)),
    }))
    .sort((a, b) => b.count - a.count);
}

function computeDurationData(row: AnalyticsBookingRow, bucket: DurationBucket) {
  pushDuration(toSeconds(row.requestedAt, row.assignedAt), bucket.dispatchLatency);
  pushDuration(toSeconds(row.assignedAt, row.arrivedAt), bucket.responseTime);
  pushDuration(toSeconds(row.arrivedAt, row.pickedupAt), bucket.onSceneTime);
  pushDuration(toSeconds(row.pickedupAt, row.completedAt), bucket.transportTime);
  pushDuration(toSeconds(row.requestedAt, row.completedAt), bucket.endToEndTime);
}

@Injectable()
export class AnalyticsCoreService {
  constructor(
    private readonly dispatcherService: DispatcherEventsService,
    private readonly analyticsRepository: AnalyticsRepository
  ) {}

  async getResponseAnalytics(dispatcherId: string, from?: string, to?: string): Promise<AnalyticsResponse> {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const providerId = dispatcher.providerId;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const rows = await this.analyticsRepository.getAnalyticsRows(providerId, {
      from: fromDate,
      to: toDate,
    });

    const globalDurations = createDurationBucket();
    const perDriver = new Map<
      string,
      {
        driverId: string | null;
        driverName: string | null;
        totalBookings: number;
        completedBookings: number;
        cancelledBookings: number;
        durations: DurationBucket;
      }
    >();

    let completedBookings = 0;
    let cancelledBookings = 0;

    for (const row of rows) {
      computeDurationData(row, globalDurations);

      if (row.status === "COMPLETED") completedBookings += 1;
      if (row.status === "CANCELLED") cancelledBookings += 1;

      const driverKey = row.driverId ?? "unassigned";
      const driverEntry = perDriver.get(driverKey) ?? {
        driverId: row.driverId,
        driverName: row.driverName,
        totalBookings: 0,
        completedBookings: 0,
        cancelledBookings: 0,
        durations: createDurationBucket(),
      };
      driverEntry.totalBookings += 1;
      if (row.status === "COMPLETED") driverEntry.completedBookings += 1;
      if (row.status === "CANCELLED") driverEntry.cancelledBookings += 1;
      computeDurationData(row, driverEntry.durations);
      perDriver.set(driverKey, driverEntry);
    }

    const drivers: DriverResponseMetricRow[] = Array.from(perDriver.values())
      .map((entry) => ({
        driverId: entry.driverId,
        driverName: entry.driverName,
        totalBookings: entry.totalBookings,
        completedBookings: entry.completedBookings,
        cancelledBookings: entry.cancelledBookings,
        completionRate: rate(entry.completedBookings, entry.totalBookings),
        cancellationRate: rate(entry.cancelledBookings, entry.totalBookings),
        dispatchLatency: summarizeDurations(entry.durations.dispatchLatency),
        responseTime: summarizeDurations(entry.durations.responseTime),
        onSceneTime: summarizeDurations(entry.durations.onSceneTime),
        transportTime: summarizeDurations(entry.durations.transportTime),
        endToEndTime: summarizeDurations(entry.durations.endToEndTime),
      }))
      .sort((a, b) => b.totalBookings - a.totalBookings);

    const totalBookings = rows.length;
    return {
      providerId,
      from: fromDate ? fromDate.toISOString() : null,
      to: toDate ? toDate.toISOString() : null,
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate: rate(completedBookings, totalBookings),
      cancellationRate: rate(cancelledBookings, totalBookings),
      dispatchLatency: summarizeDurations(globalDurations.dispatchLatency),
      responseTime: summarizeDurations(globalDurations.responseTime),
      onSceneTime: summarizeDurations(globalDurations.onSceneTime),
      transportTime: summarizeDurations(globalDurations.transportTime),
      endToEndTime: summarizeDurations(globalDurations.endToEndTime),
      drivers,
    };
  }

  async getZonesAnalytics(dispatcherId: string, from?: string, to?: string): Promise<AnalyticsZones> {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const providerId = dispatcher.providerId;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const rows = await this.analyticsRepository.getAnalyticsRows(providerId, {
      from: fromDate,
      to: toDate,
    });

    const originPoints = rows
      .filter((row) => row.pickupLocationX !== null && row.pickupLocationY !== null)
      .map((row) => ({ lng: row.pickupLocationX as number, lat: row.pickupLocationY as number }));

    const destinationPoints = rows
      .filter((row) => row.hospitalLocationX !== null && row.hospitalLocationY !== null)
      .map((row) => ({ lng: row.hospitalLocationX as number, lat: row.hospitalLocationY as number }));

    return {
      providerId,
      from: fromDate ? fromDate.toISOString() : null,
      to: toDate ? toDate.toISOString() : null,
      cellSizeDegrees: ZONE_CELL_SIZE_DEGREES,
      responseOrigins: buildZoneCells(originPoints, ZONE_CELL_SIZE_DEGREES),
      hospitalDestinations: buildZoneCells(destinationPoints, ZONE_CELL_SIZE_DEGREES),
    };
  }

  async getInsightsAnalytics(dispatcherId: string, from?: string, to?: string): Promise<AnalyticsInsights> {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const providerId = dispatcher.providerId;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const rows = await this.analyticsRepository.getAnalyticsRows(providerId, {
      from: fromDate,
      to: toDate,
    });

    const total = rows.length;
    const funnelCounts = {
      requested: total,
      assigned: rows.filter((row) => row.assignedAt !== null).length,
      arrived: rows.filter((row) => row.arrivedAt !== null).length,
      pickedup: rows.filter((row) => row.pickedupAt !== null).length,
      completed: rows.filter((row) => row.status === "COMPLETED").length,
      cancelled: rows.filter((row) => row.status === "CANCELLED").length,
    };

    const funnel: FunnelStageMetric[] = [
      { stage: "REQUESTED", count: funnelCounts.requested, percentage: rate(funnelCounts.requested, total) },
      { stage: "ASSIGNED", count: funnelCounts.assigned, percentage: rate(funnelCounts.assigned, total) },
      { stage: "ARRIVED", count: funnelCounts.arrived, percentage: rate(funnelCounts.arrived, total) },
      { stage: "PICKEDUP", count: funnelCounts.pickedup, percentage: rate(funnelCounts.pickedup, total) },
      { stage: "COMPLETED", count: funnelCounts.completed, percentage: rate(funnelCounts.completed, total) },
      { stage: "CANCELLED", count: funnelCounts.cancelled, percentage: rate(funnelCounts.cancelled, total) },
    ];

    const cancellationMap = new Map<string, number>();
    for (const row of rows) {
      if (row.status !== "CANCELLED") continue;
      const key = row.cancellationReason?.trim() || "Unspecified";
      cancellationMap.set(key, (cancellationMap.get(key) ?? 0) + 1);
    }
    const cancellationTotal = funnelCounts.cancelled;
    const cancellationReasons: CancellationReasonMetric[] = Array.from(cancellationMap.entries())
      .map(([reason, count]) => ({ reason, count, percentage: rate(count, cancellationTotal) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    const hourlyCounts = Array.from({ length: 24 }, () => 0);
    const weekdayCounts = Array.from({ length: 7 }, () => 0);
    for (const row of rows) {
      if (!row.requestedAt) continue;
      const requested = row.requestedAt;
      hourlyCounts[requested.getUTCHours()] += 1;
      weekdayCounts[requested.getUTCDay()] += 1;
    }

    const demandByHour: TimeBucketMetric[] = hourlyCounts.map((count, hour) => ({
      label: `${hour.toString().padStart(2, "0")}:00`,
      count,
    }));

    const demandByWeekday: TimeBucketMetric[] = weekdayCounts.map((count, day) => ({
      label: WEEKDAY_LABELS[day],
      count,
    }));

    const hospitalChoiceMap = new Map<string, { hospitalId: string; hospitalName: string; count: number }>();
    for (const row of rows) {
      if (!row.hospitalId || !row.hospitalName) continue;
      const entry = hospitalChoiceMap.get(row.hospitalId) ?? {
        hospitalId: row.hospitalId,
        hospitalName: row.hospitalName,
        count: 0,
      };
      entry.count += 1;
      hospitalChoiceMap.set(row.hospitalId, entry);
    }

    const hospitalChoices: HospitalChoiceMetric[] = Array.from(hospitalChoiceMap.values())
      .map((entry) => ({ ...entry, percentage: rate(entry.count, total) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      providerId,
      from: fromDate ? fromDate.toISOString() : null,
      to: toDate ? toDate.toISOString() : null,
      funnel,
      cancellationReasons,
      demandByHour,
      demandByWeekday,
      hospitalChoices,
      etaDeltaQuality: null,
    };
  }

  async getAiAnalyticsResponse(
    dispatcherId: string,
    question: string,
    from?: string,
    to?: string
  ): Promise<AnalyticsAiResponse> {
    const [response, insights] = await Promise.all([
      this.getResponseAnalytics(dispatcherId, from, to),
      this.getInsightsAnalytics(dispatcherId, from, to),
    ]);

    const normalized = question.toLowerCase();
    const highlights: string[] = [];
    let answer = "";

    const topCancellation = insights.cancellationReasons[0];
    const topHospital = insights.hospitalChoices[0];
    const topDriver = response.drivers[0];

    if (normalized.includes("cancel")) {
      answer = `Cancellation rate is ${response.cancellationRate.toFixed(2)}% (${response.cancelledBookings}/${response.totalBookings}).`;
      if (topCancellation) {
        highlights.push(
          `Top cancellation reason: ${topCancellation.reason} (${topCancellation.percentage.toFixed(1)}%).`
        );
      }
    } else if (normalized.includes("driver") || normalized.includes("performance")) {
      if (topDriver) {
        answer = `${topDriver.driverName ?? "Top driver"} handled ${topDriver.totalBookings} bookings with ${topDriver.completionRate.toFixed(1)}% completion and median response ${formatDuration(topDriver.responseTime.medianSeconds)}.`;
      } else {
        answer = "No driver performance data is available for this range.";
      }
    } else if (normalized.includes("hospital")) {
      if (topHospital) {
        answer = `${topHospital.hospitalName} is the most selected destination with ${topHospital.count} bookings (${topHospital.percentage.toFixed(1)}%).`;
      } else {
        answer = "No hospital selection data is available for this range.";
      }
    } else if (
      normalized.includes("demand") ||
      normalized.includes("hour") ||
      normalized.includes("day")
    ) {
      const peakHour = insights.demandByHour.slice().sort((a, b) => b.count - a.count)[0];
      const peakDay = insights.demandByWeekday.slice().sort((a, b) => b.count - a.count)[0];
      answer = `Peak demand hour is ${peakHour?.label ?? "-"} with ${peakHour?.count ?? 0} requests; peak weekday is ${peakDay?.label ?? "-"} with ${peakDay?.count ?? 0} requests.`;
    } else {
      answer = `In this period, completion is ${response.completionRate.toFixed(2)}% and cancellation is ${response.cancellationRate.toFixed(2)}%. Median dispatch latency is ${formatDuration(response.dispatchLatency.medianSeconds)} and median response time is ${formatDuration(response.responseTime.medianSeconds)}.`;
      if (topHospital) {
        highlights.push(`Top hospital: ${topHospital.hospitalName} (${topHospital.count} bookings).`);
      }
      if (topDriver) {
        highlights.push(
          `Top driver by volume: ${topDriver.driverName ?? "Unassigned"} (${topDriver.totalBookings} bookings).`
        );
      }
    }

    if (highlights.length === 0) {
      highlights.push(`Total bookings analyzed: ${response.totalBookings}.`);
      if (topCancellation) {
        highlights.push(`Top cancellation reason: ${topCancellation.reason}.`);
      }
    }

    return {
      answer,
      highlights,
      generatedAt: new Date().toISOString(),
    };
  }

  async createAnalyticsReportPdf(dispatcherId: string, from?: string, to?: string): Promise<Buffer> {
    const [response, insights] = await Promise.all([
      this.getResponseAnalytics(dispatcherId, from, to),
      this.getInsightsAnalytics(dispatcherId, from, to),
    ]);

    const doc = new PDFDocument({ margin: 42 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk as Buffer));

    const ended = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(18).text("Ambulink Analytics Report");
    doc.moveDown(0.4);
    doc.fontSize(10).fillColor("#666666").text(`Generated: ${new Date().toISOString()}`);
    doc.text(`Provider: ${response.providerId}`);
    doc.text(`Range: ${response.from ?? "all-time"}  ->  ${response.to ?? "now"}`);
    doc.moveDown();

    doc.fillColor("#111111").fontSize(13).text("Summary");
    doc.fontSize(11).text(`Total bookings: ${response.totalBookings}`);
    doc.text(`Completion rate: ${response.completionRate.toFixed(2)}%`);
    doc.text(`Cancellation rate: ${response.cancellationRate.toFixed(2)}%`);
    doc.moveDown();

    doc.fontSize(13).text("Top Drivers (by booking volume)");
    response.drivers.slice(0, 10).forEach((driver, index) => {
      doc
        .fontSize(10)
        .text(
          `${index + 1}. ${driver.driverName ?? "Unassigned"} - ${driver.totalBookings} bookings | completion ${driver.completionRate.toFixed(1)}%`
        );
    });
    doc.moveDown();

    doc.fontSize(13).text("Cancellation Reasons");
    if (insights.cancellationReasons.length === 0) {
      doc.fontSize(10).text("No cancellation reasons recorded in this period.");
    } else {
      insights.cancellationReasons.forEach((reason, index) => {
        doc
          .fontSize(10)
          .text(`${index + 1}. ${reason.reason} - ${reason.count} (${reason.percentage.toFixed(1)}%)`);
      });
    }
    doc.moveDown();

    doc.fontSize(13).text("Top Hospitals");
    if (insights.hospitalChoices.length === 0) {
      doc.fontSize(10).text("No hospital choices recorded in this period.");
    } else {
      insights.hospitalChoices.slice(0, 10).forEach((hospital, index) => {
        doc
          .fontSize(10)
          .text(
            `${index + 1}. ${hospital.hospitalName} - ${hospital.count} (${hospital.percentage.toFixed(1)}%)`
          );
      });
    }

    doc.end();
    return ended;
  }
}
