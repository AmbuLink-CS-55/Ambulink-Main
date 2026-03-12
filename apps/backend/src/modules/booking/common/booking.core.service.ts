import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { bookings } from "@/core/database/schema";
import type { Booking, Hospital, User } from "@/core/database/schema";
import { DbExecutor, DbService } from "@/core/database/db.service";
import { DispatcherEventsService } from "../../dispatcher/events/dispatcher.events.service";
import type {
  BookingInsightsAnalytics,
  BookingResponseAnalytics,
  BookingZonesAnalytics,
  BookingAttachment,
  BookingDetailsPayload,
  BookingReroutedPayload,
  BookingLogEntry,
  BookingNote,
  BookingStatus,
  CancellationReasonMetric,
  DispatcherBookingPayload,
  DispatcherBookingUpdatePayload,
  DriverResponseMetricRow,
  EmtNote,
  FunnelStageMetric,
  HospitalChoiceMetric,
  TimeBucketMetric,
  ZoneGridCell,
  PatientSettingsData,
} from "@ambulink/types";
import { mapAssignedBookingPayload, mapDispatcherBookingPayload } from "@/common/mappers";
import type { ManualAssignBookingDto, ReassignBookingDto } from "@/common/validation/schemas";
import { BookingSharedRepository } from "./booking.shared.repository";
import type { BookingAnalyticsRow } from "./booking.shared.repository";
import { BookingMediaService } from "../booking-media.service";
import type { UploadedMediaFile } from "../booking-media.service";
import { EventBusService } from "@/core/events/event-bus.service";
import { DriverEventsService } from "../../driver/events/driver.events.service";
import { PatientEventsService } from "../../patient/events/patient.events.service";
import { HospitalEventsService } from "../../hospital/events/hospital.events.service";
import { EmtEventsService } from "../../emt/events/emt.events.service";

const bookingError = (code: string, message: string) => ({ code, message });

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

  const counts = new Map<
    string,
    {
      count: number;
      center: { x: number; y: number };
    }
  >();

  for (const point of points) {
    const cell = toCellKey(point.lat, point.lng, cellSize);
    const existing = counts.get(cell.key);
    if (existing) {
      existing.count += 1;
      continue;
    }
    counts.set(cell.key, {
      count: 1,
      center: cell.center,
    });
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

function computeDurationData(row: BookingAnalyticsRow, bucket: DurationBucket) {
  pushDuration(toSeconds(row.requestedAt, row.assignedAt), bucket.dispatchLatency);
  pushDuration(toSeconds(row.assignedAt, row.arrivedAt), bucket.responseTime);
  pushDuration(toSeconds(row.arrivedAt, row.pickedupAt), bucket.onSceneTime);
  pushDuration(toSeconds(row.pickedupAt, row.completedAt), bucket.transportTime);
  pushDuration(toSeconds(row.requestedAt, row.completedAt), bucket.endToEndTime);
}

@Injectable()
export class BookingCoreService {
  private static readonly ACTIVE_BOOKING_STATUSES: BookingStatus[] = [
    "ASSIGNED",
    "ARRIVED",
    "PICKEDUP",
  ];

  constructor(
    private dbService: DbService,
    private dispatcherService: DispatcherEventsService,
    private eventBus: EventBusService,
    private bookingRepository: BookingSharedRepository,
    private bookingMediaService: BookingMediaService,
    @Inject(forwardRef(() => DriverEventsService))
    private driverService: DriverEventsService,
    @Inject(forwardRef(() => PatientEventsService))
    private patientService: PatientEventsService,
    private hospitalService: HospitalEventsService,
    @Inject(forwardRef(() => EmtEventsService))
    private emtService: EmtEventsService
  ) {}

  async createBooking(
    patient: { id: string },
    _patientLat: number,
    _patientLng: number,
    pickupAddr: string | null,
    hospital: Pick<Hospital, "id">,
    pickedDriver: Pick<User, "id" | "providerId">,
    emergencyType: string | null,
    patientProfileSnapshot: PatientSettingsData | null,
    dispatcherId?: string | null,
    db: DbExecutor = this.dbService.db
  ) {
    if (!pickedDriver.providerId) {
      throw new BadRequestException(
        bookingError("BOOKING_DRIVER_WITHOUT_PROVIDER", "Driver without provider")
      );
    }

    const [createdBooking] = await this.bookingRepository.createBooking(
      {
        patientId: patient.id,
        pickupAddress: pickupAddr,
        pickupLocation: { x: _patientLng, y: _patientLat },
        providerId: pickedDriver.providerId,
        driverId: pickedDriver.id,
        hospitalId: hospital.id,
        dispatcherId: dispatcherId ?? null,
        emergencyType: emergencyType,
        patientProfileSnapshot,
        fareEstimate: null,
      },
      db
    );

    return { bookingId: createdBooking?.id ?? null };
  }

  async buildAssignedBookingPayload(bookingId: string) {
    const [row] = await this.bookingRepository.getAssignedBookingPayloadRow(bookingId);
    return mapAssignedBookingPayload(row);
  }

  async manualAssignBooking(dispatcherId: string, payload: ManualAssignBookingDto) {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const driver = await this.driverService.getDriverForProviderOrThrow(
      payload.driverId,
      dispatcher.providerId
    );
    const hospital = await this.hospitalService.getByIdOrThrow(payload.hospitalId);

    const booking = await this.dbService.db.transaction(async (tx) => {
      await this.driverService.assertDriverNotBusy(payload.driverId, tx);

      const patient = await this.patientService.resolveOrCreateManualAssignmentPatient(payload, tx);
      const pickupAddress = payload.pickupAddress ?? null;
      const emergencyType = payload.emergencyType ?? null;

      const created = await this.createBooking(
        { id: patient.id },
        payload.pickupLocation.y,
        payload.pickupLocation.x,
        pickupAddress,
        hospital,
        driver,
        emergencyType,
        null,
        dispatcherId,
        tx
      );

      if (!created.bookingId) {
        throw new BadRequestException(
          bookingError("BOOKING_CREATION_FAILED", "Booking creation failed")
        );
      }

      await this.bookingRepository.setUserSubscribedBooking(patient.id, created.bookingId, tx);
      await this.bookingRepository.setUserSubscribedBooking(driver.id, created.bookingId, tx);
      await this.driverService.markBusy(driver.id, tx);
      return { bookingId: created.bookingId, patientId: patient.id };
    });

    await this.bindPatientDraftUploads(booking.patientId, booking.bookingId);

    const assignedPayload = await this.buildAssignedBookingPayload(booking.bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(booking.bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException(
        bookingError("BOOKING_PAYLOAD_BUILD_FAILED", "Failed to build booking payload")
      );
    }

    this.emitDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);
    this.emitDriver(driver.id, "booking:assigned", assignedPayload);
    this.emitPatient(booking.patientId, "booking:assigned", assignedPayload);

    return {
      bookingId: booking.bookingId,
      assignedPayload,
      dispatcherPayload,
    };
  }

  async reassignBooking(bookingId: string, dispatcherId: string, payload: ReassignBookingDto) {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const [booking] = await this.dbService.db
      .select()
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    if (!booking) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    this.dispatcherService.assertWithinProviderScope(booking.providerId, dispatcher.providerId);

    if (booking.dispatcherId && booking.dispatcherId !== dispatcherId) {
      throw new ForbiddenException(
        bookingError(
          "BOOKING_ASSIGNED_TO_ANOTHER_DISPATCHER",
          "Only the assigned dispatcher can reassign this booking"
        )
      );
    }

    if (!BookingCoreService.ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        bookingError("BOOKING_NOT_ACTIVE", "Only active bookings can be reassigned")
      );
    }

    const updateData: Partial<Booking> = {};

    if (payload.hospitalId) {
      await this.hospitalService.getByIdOrThrow(payload.hospitalId);
      updateData.hospitalId = payload.hospitalId;
    }

    if (payload.pickupAddress !== undefined) {
      updateData.pickupAddress = payload.pickupAddress;
    }

    const previousDriverId = booking.driverId;
    let nextDriverId = booking.driverId;

    await this.dbService.db.transaction(async (tx) => {
      if (payload.driverId && payload.driverId !== booking.driverId) {
        const nextDriver = await this.driverService.getDriverForProviderOrThrow(
          payload.driverId,
          dispatcher.providerId,
          tx
        );
        await this.driverService.assertDriverNotBusy(payload.driverId, tx);
        updateData.driverId = nextDriver.id;
        nextDriverId = nextDriver.id;
        await this.bookingRepository.setUserSubscribedBooking(nextDriver.id, bookingId, tx);
        await this.driverService.markBusy(nextDriver.id, tx);
      }

      if (Object.keys(updateData).length > 0) {
        await this.bookingRepository.updateBooking(bookingId, updateData, tx);
      }

      if (payload.pickupLocation) {
        await tx
          .update(bookings)
          .set({
            pickupLocation: sql`ST_SetSRID(ST_MakePoint(${payload.pickupLocation.x}, ${payload.pickupLocation.y}), 4326)`,
          })
          .where(eq(bookings.id, bookingId));
      }

      if (previousDriverId && nextDriverId && previousDriverId !== nextDriverId) {
        const oldDriverBookings = await this.bookingRepository.getDriverActiveBooking(
          previousDriverId,
          tx
        );
        if (oldDriverBookings.length === 0) {
          await this.bookingRepository.clearUserSubscribedBooking(previousDriverId, tx);
          await this.driverService.markAvailableIfNoActiveBookings(previousDriverId, tx);
        }
      }
    });

    const assignedPayload = await this.buildAssignedBookingPayload(bookingId);
    const dispatcherPayload = await this.buildDispatcherBookingPayload(bookingId);

    if (!assignedPayload || !dispatcherPayload) {
      throw new BadRequestException(
        bookingError("BOOKING_PAYLOAD_BUILD_FAILED", "Failed to build booking payload")
      );
    }

    if (previousDriverId && nextDriverId && previousDriverId !== nextDriverId) {
      this.emitDriver(previousDriverId, "booking:cancelled", {
        bookingId,
        reason: "Reassigned by dispatcher",
      });
    }

    if (nextDriverId) {
      this.emitDriver(nextDriverId, "booking:assigned", assignedPayload);
    }
    if (booking.patientId) {
      this.emitPatient(
        booking.patientId,
        "booking:assigned",
        assignedPayload
      );
    }
    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.emitEmt(subscriber.emtId, "booking:assigned", assignedPayload);
    }
    this.emitDispatcher(dispatcherId, "booking:assigned", dispatcherPayload);

    const rerouteReasonParts: string[] = [];
    if (payload.driverId && payload.driverId !== previousDriverId) {
      rerouteReasonParts.push("Driver reassigned");
    }
    if (payload.hospitalId) {
      rerouteReasonParts.push("Hospital updated");
    }
    if (payload.pickupLocation) {
      rerouteReasonParts.push("Pickup location updated");
    }
    if (payload.pickupAddress !== undefined) {
      rerouteReasonParts.push("Pickup address updated");
    }

    if (rerouteReasonParts.length > 0) {
      const reroutedPayload = {
        bookingId,
        reason: rerouteReasonParts.join(", "),
        changedAt: new Date().toISOString(),
      } satisfies BookingReroutedPayload;

      if (nextDriverId) {
        this.emitDriver(nextDriverId, "booking:rerouted", reroutedPayload);
      }
      if (booking.patientId) {
        this.emitPatient(booking.patientId, "booking:rerouted", reroutedPayload);
      }
      for (const subscriber of emtSubscribers) {
        this.emitEmt(subscriber.emtId, "booking:rerouted", reroutedPayload);
      }
      if (booking.providerId) {
        const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(
          booking.providerId
        );
        for (const id of dispatcherIds) {
          this.emitDispatcher(id, "booking:rerouted", {
            ...reroutedPayload,
            providerId: booking.providerId,
          });
        }
      } else {
        this.emitDispatcher(dispatcherId, "booking:rerouted", reroutedPayload);
      }
    }

    return {
      bookingId,
      assignedPayload,
      dispatcherPayload,
    };
  }

  async updateBooking(bookingId: string, booking: Partial<Booking>) {
    const updateData: Partial<Booking> = { ...booking };

    if (booking.status === "COMPLETED") {
      updateData.ongoing = false;
      updateData.completedAt = new Date();
    }

    if (booking.status === "CANCELLED") {
      updateData.ongoing = false;
    }

    const { updatedBooking, emtSubscriberIds } = await this.dbService.db.transaction(async (tx) => {
      const [record] = await this.bookingRepository.updateBooking(bookingId, updateData, tx);
      if (!record) {
        return { updatedBooking: undefined, emtSubscriberIds: [] as string[] };
      }

      const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(record.id, tx);

      if (record.status === "COMPLETED" || record.status === "CANCELLED") {
        await this.bookingRepository.clearSubscribedBookingForBooking(record.id, tx);
      }

      return {
        updatedBooking: record,
        emtSubscriberIds: emtSubscribers.map((subscriber) => subscriber.emtId),
      };
    });

    if (updatedBooking?.dispatcherId) {
      if (updatedBooking.status === "REQUESTED") {
        return updatedBooking;
      }
      this.emitDispatcher(updatedBooking.dispatcherId, "booking:update", {
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
        providerId: updatedBooking.providerId ?? null,
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (updatedBooking?.providerId) {
      this.emitAllDispatchers("booking:log", {
        providerId: updatedBooking.providerId,
        bookingId: updatedBooking.id,
        status: updatedBooking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    if (updatedBooking?.patientId && updatedBooking.status === "ARRIVED") {
      this.emitPatient(updatedBooking.patientId, "booking:arrived", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.patientId && updatedBooking.status === "COMPLETED") {
      this.emitPatient(updatedBooking.patientId, "booking:completed", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.driverId && updatedBooking.status === "COMPLETED") {
      this.emitDriver(updatedBooking.driverId, "booking:completed", {
        bookingId: updatedBooking.id,
      });
    }

    if (updatedBooking?.driverId && updatedBooking.status === "CANCELLED") {
      this.emitDriver(updatedBooking.driverId, "booking:cancelled", {
        bookingId: updatedBooking.id,
        reason: updatedBooking.cancellationReason ?? "Booking cancelled",
      });
    }

    if (
      updatedBooking?.status === "ARRIVED" ||
      updatedBooking?.status === "COMPLETED" ||
      updatedBooking?.status === "CANCELLED"
    ) {
      for (const emtId of emtSubscriberIds) {
        if (updatedBooking.status === "ARRIVED") {
          this.emitEmt(emtId, "booking:arrived", {
            bookingId: updatedBooking.id,
          });
        } else if (updatedBooking.status === "COMPLETED") {
          this.emitEmt(emtId, "booking:completed", {
            bookingId: updatedBooking.id,
          });
        } else {
          this.emitEmt(emtId, "booking:cancelled", {
            bookingId: updatedBooking.id,
            reason: updatedBooking.cancellationReason ?? "Booking cancelled",
          });
        }
      }
    }

    return updatedBooking;
  }

  async getActiveBookingForPatient(patientId: string) {
    const [subscription] = await this.bookingRepository.getUserSubscribedBooking(patientId);
    if (subscription?.subscribedBookingId) {
      const [subscribedBooking] = await this.bookingRepository.getActiveBookingById(
        subscription.subscribedBookingId
      );
      if (subscribedBooking) {
        return subscribedBooking;
      }
    }

    const booking = await this.bookingRepository.getActiveBookingForPatient(patientId);
    return booking[0];
  }

  async getActiveBookingForDriver(driverId: string) {
    const [subscription] = await this.bookingRepository.getUserSubscribedBooking(driverId);
    if (subscription?.subscribedBookingId) {
      const [subscribedBooking] = await this.bookingRepository.getActiveBookingById(
        subscription.subscribedBookingId
      );
      if (subscribedBooking) {
        return subscribedBooking;
      }
    }

    const booking = await this.bookingRepository.getDriverActiveBooking(driverId);
    return booking[0];
  }

  async cancelByPatient(patientId: string, reason: string) {
    const { booking, emtSubscriberIds } = await this.dbService.db.transaction(async (tx) => {
      const [booking] = await this.bookingRepository.cancelBookingByPatient(patientId, reason, tx);
      if (!booking) {
        return { booking: null, emtSubscriberIds: [] as string[] };
      }

      const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(
        booking.id,
        tx
      );
      await this.bookingRepository.clearSubscribedBookingForBooking(booking.id, tx);

      if (booking.driverId) {
        await this.driverService.markAvailableIfNoActiveBookings(booking.driverId, tx);
      }

      return {
        booking,
        emtSubscriberIds: emtSubscribers.map((subscriber) => subscriber.emtId),
      };
    });

    if (!booking) {
      return null;
    }

    if (booking.dispatcherId) {
      this.emitDispatcher(booking.dispatcherId, "booking:update", {
        bookingId: booking.id,
        status: "CANCELLED",
        updatedAt: new Date().toISOString(),
        providerId: booking.providerId ?? null,
      } satisfies DispatcherBookingUpdatePayload);
    }

    if (booking.providerId) {
      const providerUpdatePayload = {
        bookingId: booking.id,
        status: "CANCELLED" as const,
        updatedAt: new Date().toISOString(),
        providerId: booking.providerId,
      } satisfies DispatcherBookingUpdatePayload;
      this.emitAllDispatchers("booking:update", providerUpdatePayload);
      this.emitAllDispatchers("booking:log", {
        providerId: booking.providerId,
        bookingId: booking.id,
        status: booking.status,
        updatedAt: new Date().toISOString(),
      });
    }

    for (const emtId of emtSubscriberIds) {
      this.emitEmt(emtId, "booking:cancelled", {
        bookingId: booking.id,
        reason,
      });
    }

    return booking;
  }

  async createApprovedBooking(
    patient: { id: string },
    pickup: { x: number; y: number },
    hospital: Pick<Hospital, "id">,
    pickedDriver: Pick<User, "id" | "providerId">,
    dispatcherId: string,
    patientProfileSnapshot: PatientSettingsData | null
  ) {
    return this.dbService.db.transaction(async (tx) => {
      const activeDriverBookings = await this.bookingRepository.getDriverActiveBooking(
        pickedDriver.id,
        tx
      );
      if (activeDriverBookings.length > 0) {
        throw new ConflictException(
          bookingError("BOOKING_DRIVER_BUSY", "Selected driver already has an active booking")
        );
      }

      const booking = await this.createBooking(
        patient,
        pickup.y,
        pickup.x,
        null,
        hospital,
        pickedDriver,
        null,
        patientProfileSnapshot,
        dispatcherId,
        tx
      );
      if (!booking.bookingId) {
        throw new BadRequestException(
          bookingError("BOOKING_CREATION_FAILED", "Booking creation failed")
        );
      }

      await this.bookingRepository.setUserSubscribedBooking(patient.id, booking.bookingId, tx);
      await this.bookingRepository.setUserSubscribedBooking(pickedDriver.id, booking.bookingId, tx);
      await this.driverService.markBusy(pickedDriver.id, tx);
      return booking;
    });
  }

  async getDispatcherActiveBookings(dispatcherId: string) {
    const rows = await this.bookingRepository.getDispatcherActiveBookingRows(dispatcherId);

    return rows
      .map((row) => mapDispatcherBookingPayload(row))
      .filter((payload): payload is DispatcherBookingPayload => payload !== null);
  }

  async buildDispatcherBookingPayload(bookingId: string, requestId?: string) {
    const [row] = await this.bookingRepository.getDispatcherBookingPayloadRow(bookingId);

    if (!row) return null;

    return mapDispatcherBookingPayload(row, requestId);
  }

  async getBookingLog(providerId?: string, status?: string): Promise<BookingLogEntry[]> {
    const rows = await this.bookingRepository.getBookingLogRows(providerId, status);
    return rows.map((row) => ({
      ...row,
      requestedAt: row.requestedAt ? row.requestedAt.toISOString() : null,
      assignedAt: row.assignedAt ? row.assignedAt.toISOString() : null,
      arrivedAt: row.arrivedAt ? row.arrivedAt.toISOString() : null,
      pickedupAt: row.pickedupAt ? row.pickedupAt.toISOString() : null,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    }));
  }

  async getBookingResponseAnalytics(
    dispatcherId: string,
    from?: string,
    to?: string
  ): Promise<BookingResponseAnalytics> {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const providerId = dispatcher.providerId;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const rows = await this.bookingRepository.getBookingAnalyticsRows(providerId, {
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

  async getBookingZonesAnalytics(
    dispatcherId: string,
    from?: string,
    to?: string
  ): Promise<BookingZonesAnalytics> {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const providerId = dispatcher.providerId;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const rows = await this.bookingRepository.getBookingAnalyticsRows(providerId, {
      from: fromDate,
      to: toDate,
    });

    const originPoints = rows
      .filter((row) => row.pickupLocationX !== null && row.pickupLocationY !== null)
      .map((row) => ({
        lng: row.pickupLocationX as number,
        lat: row.pickupLocationY as number,
      }));

    const destinationPoints = rows
      .filter((row) => row.hospitalLocationX !== null && row.hospitalLocationY !== null)
      .map((row) => ({
        lng: row.hospitalLocationX as number,
        lat: row.hospitalLocationY as number,
      }));

    return {
      providerId,
      from: fromDate ? fromDate.toISOString() : null,
      to: toDate ? toDate.toISOString() : null,
      cellSizeDegrees: ZONE_CELL_SIZE_DEGREES,
      responseOrigins: buildZoneCells(originPoints, ZONE_CELL_SIZE_DEGREES),
      hospitalDestinations: buildZoneCells(destinationPoints, ZONE_CELL_SIZE_DEGREES),
    };
  }

  async getBookingInsightsAnalytics(
    dispatcherId: string,
    from?: string,
    to?: string
  ): Promise<BookingInsightsAnalytics> {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const providerId = dispatcher.providerId;
    const fromDate = from ? new Date(from) : undefined;
    const toDate = to ? new Date(to) : undefined;
    const rows = await this.bookingRepository.getBookingAnalyticsRows(providerId, {
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
      .map(([reason, count]) => ({
        reason,
        count,
        percentage: rate(count, cancellationTotal),
      }))
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
      .map((entry) => ({
        ...entry,
        percentage: rate(entry.count, total),
      }))
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

  async getActiveBookingById(bookingId: string) {
    const [booking] = await this.bookingRepository.getActiveBookingById(bookingId);
    return booking;
  }

  async getUserSubscribedBooking(userId: string) {
    const [subscription] = await this.bookingRepository.getUserSubscribedBooking(userId);
    if (!subscription?.subscribedBookingId) {
      return null;
    }

    const [booking] = await this.bookingRepository.getActiveBookingById(
      subscription.subscribedBookingId
    );
    return booking ?? null;
  }

  async setUserSubscribedBooking(userId: string, bookingId: string) {
    await this.bookingRepository.setUserSubscribedBooking(userId, bookingId);
  }

  async searchOngoingBookingsByProvider(providerId: string, query: string, limit?: number) {
    return this.bookingRepository.searchOngoingBookingsByProvider(providerId, query, limit);
  }

  async getEmtSubscribersForBooking(bookingId: string) {
    return this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
  }

  async getOngoingBookingDispatchInfoForDriver(driverId: string) {
    const [booking] = await this.bookingRepository.getOngoingBookingDispatchInfoForDriver(driverId);
    return booking ?? null;
  }

  async startPatientUploadSession(patientId: string) {
    await this.patientService.getPatientOrThrow(patientId);
    return this.bookingMediaService.startUploadSession(patientId);
  }

  async appendPatientUploadSessionFiles(params: {
    patientId: string;
    sessionId: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    await this.patientService.getPatientOrThrow(params.patientId);
    return this.bookingMediaService.appendSessionFiles(params);
  }

  async appendBookingNote(bookingId: string, note: BookingNote) {
    const [updated] = await this.bookingRepository.appendBookingNote(bookingId, note);
    return updated;
  }

  async appendEmtNote(bookingId: string, note: EmtNote) {
    const [updated] = await this.bookingRepository.appendEmtNote(bookingId, note);
    return updated;
  }

  async getBookingDetailsForDispatcher(bookingId: string, dispatcherId: string) {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const [row] = await this.bookingRepository.getBookingDetailsRow(bookingId);
    if (!row) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    this.dispatcherService.assertWithinProviderScope(row.providerId, dispatcher.providerId);

    return {
      bookingId: row.bookingId,
      status: row.status,
      requestedAt: row.requestedAt ? row.requestedAt.toISOString() : null,
      assignedAt: row.assignedAt ? row.assignedAt.toISOString() : null,
      arrivedAt: row.arrivedAt ? row.arrivedAt.toISOString() : null,
      pickedupAt: row.pickedupAt ? row.pickedupAt.toISOString() : null,
      completedAt: row.completedAt ? row.completedAt.toISOString() : null,
      cancellationReason: row.cancellationReason ?? null,
      patient: {
        id: row.patientId ?? null,
        fullName: row.patientName ?? null,
        phoneNumber: row.patientPhone ?? null,
      },
      driver: {
        id: row.driverId ?? null,
        fullName: row.driverName ?? null,
        phoneNumber: row.driverPhone ?? null,
      },
      hospital: {
        id: row.hospitalId ?? null,
        name: row.hospitalName ?? null,
        phoneNumber: row.hospitalPhone ?? null,
      },
      provider: {
        id: row.providerId ?? null,
        name: row.providerName ?? null,
      },
      notes: this.normalizeBookingNotes(row.notes, row.bookingId),
    } satisfies BookingDetailsPayload;
  }

  async addDispatcherNote(bookingId: string, dispatcherId: string, content: string) {
    const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(dispatcherId);
    const [booking] = await this.bookingRepository.getBookingDetailsRow(bookingId);
    if (!booking) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    this.dispatcherService.assertWithinProviderScope(booking.providerId, dispatcher.providerId);
    if (!BookingCoreService.ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        bookingError("BOOKING_NOT_ACTIVE", "Dispatcher notes are only allowed for active bookings")
      );
    }

    const note: BookingNote = {
      id: randomUUID(),
      bookingId,
      authorId: dispatcherId,
      authorName: dispatcher.fullName ?? "Dispatcher",
      authorRole: "DISPATCHER",
      content,
      type: "TEXT",
      attachments: [],
      createdAt: new Date().toISOString(),
    };

    await this.bookingRepository.appendBookingNote(bookingId, note);

    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(
      dispatcher.providerId
    );
    for (const id of dispatcherIds) {
      this.emitDispatcher(id, "booking:notes", { bookingId, note });
    }

    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.emitEmt(subscriber.emtId, "booking:notes", { bookingId, note });
    }

    if (booking.patientId) {
      this.emitPatient(booking.patientId, "booking:notes", {
        bookingId,
        note,
      });
    }

    return note;
  }

  async addPatientBookingNote(params: {
    bookingId: string;
    patientId: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    const [booking] = await this.bookingRepository.getBookingDetailsRow(params.bookingId);
    if (!booking) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }
    if (booking.patientId !== params.patientId) {
      throw new ForbiddenException(
        bookingError("BOOKING_PATIENT_SCOPE", "Patient cannot access this booking")
      );
    }
    if (!BookingCoreService.ACTIVE_BOOKING_STATUSES.includes(booking.status)) {
      throw new BadRequestException(
        bookingError("BOOKING_NOT_ACTIVE", "Patient uploads are only allowed for active bookings")
      );
    }

    const hasContent = Boolean(params.content && params.content.trim().length > 0);
    if (!hasContent && params.files.length === 0) {
      throw new BadRequestException(
        bookingError("BOOKING_NOTE_EMPTY", "Text note or at least one file is required")
      );
    }

    const patient = await this.patientService.getPatientOrThrow(params.patientId);
    const note = await this.bookingMediaService.createBookingMediaNote({
      bookingId: params.bookingId,
      authorId: params.patientId,
      authorName: patient.fullName ?? "Patient",
      authorRole: "PATIENT",
      content: params.content ?? "",
      files: params.files,
      durationMs: params.durationMs ?? null,
    });

    await this.bookingRepository.appendBookingNote(params.bookingId, note);
    await this.notifyBookingNoteParticipants(
      params.bookingId,
      note,
      booking.providerId ?? null,
      booking.patientId
    );
    return note;
  }

  async buildEmtMediaNote(params: {
    bookingId: string;
    emtId: string;
    emtName: string;
    content?: string | null;
    files: UploadedMediaFile[];
    durationMs?: number | null;
  }) {
    return this.bookingMediaService.createBookingMediaNote({
      bookingId: params.bookingId,
      authorId: params.emtId,
      authorName: params.emtName,
      authorRole: "EMT",
      content: params.content ?? "",
      files: params.files,
      durationMs: params.durationMs ?? null,
    });
  }

  async bindPatientDraftUploads(patientId: string, bookingId: string) {
    const patient = await this.patientService.getPatientOrThrow(patientId);
    const notes = await this.bookingMediaService.bindSessionsToBooking({
      patientId,
      bookingId,
      patientName: patient.fullName ?? "Patient",
    });

    if (notes.length === 0) return;
    for (const note of notes) {
      await this.bookingRepository.appendBookingNote(bookingId, note);
    }
  }

  async getAttachmentForActor(
    bookingId: string,
    attachmentId: string,
    actor: { patientId?: string; dispatcherId?: string; emtId?: string }
  ) {
    const [booking] = await this.bookingRepository.getBookingDetailsRow(bookingId);
    if (!booking) {
      throw new NotFoundException(bookingError("BOOKING_NOT_FOUND", "Booking not found"));
    }

    const notes = this.normalizeBookingNotes(booking.notes, bookingId);
    const attachment = notes
      .flatMap((note) => note.attachments ?? [])
      .find((entry) => entry.id === attachmentId);

    if (!attachment) {
      throw new NotFoundException(bookingError("ATTACHMENT_NOT_FOUND", "Attachment not found"));
    }

    if (actor.patientId) {
      this.patientService.assertBookingPatientScope(booking.patientId, actor.patientId);
      return this.bookingMediaService.getAttachmentFile(bookingId, attachment);
    }

    if (actor.dispatcherId) {
      const dispatcher = await this.dispatcherService.getDispatcherContextOrThrow(actor.dispatcherId);
      this.dispatcherService.assertWithinProviderScope(booking.providerId, dispatcher.providerId);
      return this.bookingMediaService.getAttachmentFile(bookingId, attachment);
    }

    if (actor.emtId) {
      const emt = await this.emtService.getEmtOrThrow(actor.emtId);
      this.emtService.assertBookingAttachmentScope(emt, bookingId, booking.providerId);
      return this.bookingMediaService.getAttachmentFile(bookingId, attachment);
    }

    throw new ForbiddenException(bookingError("BOOKING_ACCESS_DENIED", "Access denied"));
  }

  private async notifyBookingNoteParticipants(
    bookingId: string,
    note: BookingNote,
    providerId: string | null,
    patientId?: string | null
  ) {
    const emtSubscribers = await this.bookingRepository.getEmtsSubscribedToBooking(bookingId);
    for (const subscriber of emtSubscribers) {
      this.emitEmt(subscriber.emtId, "booking:notes", { bookingId, note });
    }

    if (patientId) {
      this.emitPatient(patientId, "booking:notes", { bookingId, note });
    }

    if (!providerId) return;
    const dispatcherIds = await this.dispatcherService.findAllLiveDispatchersByProvider(providerId);
    for (const dispatcherId of dispatcherIds) {
      this.emitDispatcher(dispatcherId, "booking:notes", { bookingId, note });
    }
  }

  private emitDispatcher(dispatcherId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.dispatcher",
      dispatcherId,
      event,
      payload,
    });
  }

  private emitAllDispatchers(event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.dispatchers",
      event,
      payload,
    });
  }

  private emitDriver(driverId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.driver",
      driverId,
      event,
      payload,
    });
  }

  private emitPatient(patientId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.patient",
      patientId,
      event,
      payload,
    });
  }

  private emitEmt(emtId: string, event: string, payload: unknown) {
    this.eventBus.publish({
      type: "realtime.emt",
      emtId,
      event,
      payload,
    });
  }

  private normalizeBookingNotes(raw: unknown, bookingId: string): BookingNote[] {
    if (!Array.isArray(raw)) return [];

    const normalized: BookingNote[] = [];

    for (const entry of raw) {
      if (!entry || typeof entry !== "object") continue;
      const note = entry as Partial<BookingNote>;
      if (!note.id || !note.authorId || typeof note.content !== "string" || !note.createdAt) {
        continue;
      }

      const attachments = Array.isArray(note.attachments)
        ? note.attachments.filter((entry): entry is BookingAttachment => {
            if (!entry || typeof entry !== "object") return false;
            const candidate = entry as Partial<BookingAttachment>;
            return Boolean(
              candidate.id &&
              candidate.filename &&
              candidate.mimeType &&
              typeof candidate.sizeBytes === "number" &&
              candidate.kind &&
              candidate.url
            );
          })
        : [];
      const normalizedType = note.type === "MEDIA" || attachments.length > 0 ? "MEDIA" : "TEXT";
      const normalizedRole =
        note.authorRole === "DISPATCHER" || note.authorRole === "PATIENT" ? note.authorRole : "EMT";

      normalized.push({
        id: note.id,
        bookingId: note.bookingId ?? bookingId,
        authorId: note.authorId,
        authorName: note.authorName ?? null,
        authorRole: normalizedRole,
        content: note.content,
        type: normalizedType,
        attachments,
        createdAt: note.createdAt,
      });
    }

    return normalized.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

}
