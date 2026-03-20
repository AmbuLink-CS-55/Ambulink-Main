import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import PDFDocument from "pdfkit";
import type {
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
import {
  BOOKING_REPORT_THEME,
  drawKeyValueGrid,
  drawKpiCard,
  drawPageFooter,
  drawSectionHeader,
  drawStatusChip,
  drawTable,
  ensureVerticalSpace,
  formatCoordinate,
  formatDurationBetween,
  formatUtcTimestamp,
} from "./analytics.booking-report.utils";
type PdfDoc = InstanceType<typeof PDFDocument>;

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

  private async createBookingReportPdf(booking: AnalyticsBookingRow, providerId: string): Promise<Buffer> {
    const generatedAt = formatUtcTimestamp(new Date());
    const doc = new PDFDocument({
      margin: BOOKING_REPORT_THEME.page.margin,
      compress: false,
    });
    const chunks: Buffer[] = [];
    let pageNumber = 1;

    doc.on("data", (chunk) => chunks.push(chunk as Buffer));
    doc.on("pageAdded", () => {
      pageNumber += 1;
      this.renderBookingReportHeaderBand(doc, booking, generatedAt, providerId);
      drawPageFooter(doc, pageNumber, generatedAt, providerId);
      doc.y = BOOKING_REPORT_THEME.page.margin + 64;
    });

    const ended = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    this.renderBookingReportHeaderBand(doc, booking, generatedAt, providerId);
    drawPageFooter(doc, pageNumber, generatedAt, providerId);
    doc.y = BOOKING_REPORT_THEME.page.margin + 64;

    this.renderBookingOverviewCards(doc, booking, generatedAt, providerId);
    this.renderBookingTimelineTable(doc, booking);
    this.renderBookingEntitiesTable(doc, booking);
    this.renderBookingCoordinates(doc, booking);
    this.renderDataQualityBlock(doc, booking);

    doc.end();
    return ended;
  }

  private renderBookingReportHeaderBand(
    doc: PdfDoc,
    booking: AnalyticsBookingRow,
    generatedAt: string,
    providerId: string
  ) {
    const x = BOOKING_REPORT_THEME.page.margin;
    const y = BOOKING_REPORT_THEME.page.margin;
    const width = doc.page.width - BOOKING_REPORT_THEME.page.margin * 2;
    const height = 54;

    doc
      .roundedRect(x, y, width, height, 8)
      .fillAndStroke(BOOKING_REPORT_THEME.colors.headerBg, BOOKING_REPORT_THEME.colors.headerBg);

    doc
      .fillColor(BOOKING_REPORT_THEME.colors.headerText)
      .fontSize(BOOKING_REPORT_THEME.typography.title)
      .text("Ambulink Booking Report", x + 12, y + 10, { lineBreak: false });

    doc
      .fillColor("#CBD5E1")
      .fontSize(BOOKING_REPORT_THEME.typography.subtitle)
      .text(`Report ID: ${booking.bookingId}`, x + 12, y + 32, {
        width: width * 0.64,
        lineBreak: false,
        ellipsis: true,
      });

    doc
      .fillColor("#CBD5E1")
      .fontSize(BOOKING_REPORT_THEME.typography.subtitle)
      .text(`Generated: ${generatedAt}`, x + width - 220, y + 12, {
        width: 210,
        align: "right",
        lineBreak: false,
      });
    doc
      .fillColor("#CBD5E1")
      .fontSize(BOOKING_REPORT_THEME.typography.subtitle)
      .text(`Provider: ${providerId}`, x + width - 220, y + 30, {
        width: 210,
        align: "right",
        lineBreak: false,
        ellipsis: true,
      });
  }

  private renderBookingOverviewCards(
    doc: PdfDoc,
    booking: AnalyticsBookingRow,
    generatedAt: string,
    providerId: string
  ) {
    ensureVerticalSpace(doc, 110);
    const x = BOOKING_REPORT_THEME.page.margin;
    const sectionWidth = doc.page.width - BOOKING_REPORT_THEME.page.margin * 2;
    const y = doc.y;
    drawSectionHeader(doc, "Booking Overview", y, sectionWidth);

    const cardGap = 10;
    const cardHeight = 56;
    const cardWidth = (sectionWidth - cardGap * 2) / 3;
    const cardsY = y + 24;

    drawKpiCard(doc, {
      title: "Booking ID",
      value: booking.bookingId,
      x,
      y: cardsY,
      width: cardWidth,
      height: cardHeight,
    });
    drawKpiCard(doc, {
      title: "Completed At",
      value: formatUtcTimestamp(booking.completedAt),
      x: x + cardWidth + cardGap,
      y: cardsY,
      width: cardWidth,
      height: cardHeight,
    });
    drawKpiCard(doc, {
      title: "Generated",
      value: generatedAt,
      x: x + (cardWidth + cardGap) * 2,
      y: cardsY,
      width: cardWidth,
      height: cardHeight,
    });

    drawStatusChip(doc, booking.status, x, cardsY + cardHeight + 8);
    doc
      .fillColor(BOOKING_REPORT_THEME.colors.muted)
      .fontSize(BOOKING_REPORT_THEME.typography.label)
      .text(`Provider ${providerId}`, x + 88, cardsY + cardHeight + 12, {
        width: sectionWidth - 88,
        lineBreak: false,
        ellipsis: true,
      });

    doc.y = cardsY + cardHeight + 28;
  }

  private renderBookingTimelineTable(doc: PdfDoc, booking: AnalyticsBookingRow) {
    ensureVerticalSpace(doc, 170);
    const x = BOOKING_REPORT_THEME.page.margin;
    const width = doc.page.width - BOOKING_REPORT_THEME.page.margin * 2;
    const y = doc.y + 6;
    drawSectionHeader(doc, "Timeline", y, width);

    const rows = [
      {
        stage: "Requested",
        at: formatUtcTimestamp(booking.requestedAt),
        delta: "N/A",
      },
      {
        stage: "Assigned",
        at: formatUtcTimestamp(booking.assignedAt),
        delta: formatDurationBetween(booking.requestedAt, booking.assignedAt),
      },
      {
        stage: "Arrived",
        at: formatUtcTimestamp(booking.arrivedAt),
        delta: formatDurationBetween(booking.assignedAt, booking.arrivedAt),
      },
      {
        stage: "Picked Up",
        at: formatUtcTimestamp(booking.pickedupAt),
        delta: formatDurationBetween(booking.arrivedAt, booking.pickedupAt),
      },
      {
        stage: "Completed",
        at: formatUtcTimestamp(booking.completedAt),
        delta: formatDurationBetween(booking.pickedupAt, booking.completedAt),
      },
    ];

    const tableBottom = drawTable(doc, {
      x,
      y: y + 24,
      width,
      columns: [
        { key: "stage", label: "Stage", widthRatio: 0.28 },
        { key: "at", label: "Timestamp", widthRatio: 0.48 },
        { key: "delta", label: "Stage Duration", widthRatio: 0.24 },
      ],
      rows,
      rowHeight: 22,
    });
    doc.y = tableBottom + 10;
  }

  private renderBookingEntitiesTable(doc: PdfDoc, booking: AnalyticsBookingRow) {
    ensureVerticalSpace(doc, 130);
    const x = BOOKING_REPORT_THEME.page.margin;
    const width = doc.page.width - BOOKING_REPORT_THEME.page.margin * 2;
    const y = doc.y + 4;
    drawSectionHeader(doc, "Entities", y, width);

    const rows = [
      {
        role: "Driver",
        name: booking.driverName ?? "N/A",
        id: booking.driverId ?? "N/A",
      },
      {
        role: "Hospital",
        name: booking.hospitalName ?? "N/A",
        id: booking.hospitalId ?? "N/A",
      },
    ];

    const tableBottom = drawTable(doc, {
      x,
      y: y + 24,
      width,
      columns: [
        { key: "role", label: "Role", widthRatio: 0.2 },
        { key: "name", label: "Name", widthRatio: 0.4 },
        { key: "id", label: "Reference ID", widthRatio: 0.4 },
      ],
      rows,
      rowHeight: 22,
    });
    doc.y = tableBottom + 10;
  }

  private renderBookingCoordinates(doc: PdfDoc, booking: AnalyticsBookingRow) {
    ensureVerticalSpace(doc, 120);
    const x = BOOKING_REPORT_THEME.page.margin;
    const width = doc.page.width - BOOKING_REPORT_THEME.page.margin * 2;
    const y = doc.y + 4;
    drawSectionHeader(doc, "Coordinates", y, width);

    const rows = [
      {
        label: "Pickup (lat, lng)",
        value: `${formatCoordinate(booking.pickupLocationY)}, ${formatCoordinate(booking.pickupLocationX)}`,
      },
      {
        label: "Hospital (lat, lng)",
        value: `${formatCoordinate(booking.hospitalLocationY)}, ${formatCoordinate(booking.hospitalLocationX)}`,
      },
    ];

    drawKeyValueGrid(doc, {
      x,
      y: y + 24,
      width,
      rows,
      rowHeight: 22,
    });

    doc.y = y + 24 + rows.length * 22 + 10;
  }

  private renderDataQualityBlock(doc: PdfDoc, booking: AnalyticsBookingRow) {
    ensureVerticalSpace(doc, 120);
    const x = BOOKING_REPORT_THEME.page.margin;
    const width = doc.page.width - BOOKING_REPORT_THEME.page.margin * 2;
    const y = doc.y + 4;
    drawSectionHeader(doc, "Data Quality", y, width);

    const qualityRows = [
      {
        label: "Missing driver",
        value: booking.driverId ? "No" : "Yes",
      },
      {
        label: "Missing hospital",
        value: booking.hospitalId ? "No" : "Yes",
      },
      {
        label: "Missing timestamps",
        value:
          booking.requestedAt &&
          booking.assignedAt &&
          booking.arrivedAt &&
          booking.pickedupAt &&
          booking.completedAt
            ? "No"
            : "Yes",
      },
      {
        label: "Cancellation reason",
        value: booking.cancellationReason ?? "N/A",
      },
    ];

    drawKeyValueGrid(doc, {
      x,
      y: y + 24,
      width,
      rows: qualityRows,
      rowHeight: 22,
    });

    doc.y = y + 24 + qualityRows.length * 22 + 8;
  }

  async createAnalyticsReportPdf(
    dispatcherId: string,
    from?: string,
    to?: string,
    bookingId?: string
  ): Promise<Buffer> {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    if (bookingId) {
      const [booking] = await this.analyticsRepository.getBookingAnalyticsRow(
        dispatcher.providerId,
        bookingId
      );
      if (!booking) {
        throw new NotFoundException("Booking not found");
      }
      if (booking.status !== "COMPLETED") {
        throw new BadRequestException("Report can only be generated for completed bookings");
      }
      return this.createBookingReportPdf(booking, dispatcher.providerId);
    }

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
