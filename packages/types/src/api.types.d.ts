import type { BookingStatus } from "./database.types";
import type { Point } from "./common.types";
import type { BookingAttachment, BookingNote, EmtNote, PatientSettingsData } from "./socket.types";

export type NearbyDriver = {
  id: string;
  fullName?: string | null;
  phoneNumber?: string | null;
  providerId?: string | null;
  status?: string | null;
  location: Point | null;
  distanceMeters: number;
  distanceKm: number;
};

export type NearbyHospital = {
  id: string;
  name: string;
  hospitalType: string;
  address: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  location: Point | null;
  distanceMeters: number;
  distanceKm: number;
};

export type BookingLogEntry = {
  bookingId: string;
  status: BookingStatus;
  requestedAt: string | null;
  assignedAt: string | null;
  arrivedAt: string | null;
  pickedupAt: string | null;
  completedAt: string | null;
  updatedAt?: string | null;
  fareEstimate: string | null;
  fareFinal: string | null;
  cancellationReason: string | null;
  patientId: string | null;
  patientName: string | null;
  patientPhone: string | null;
  driverId: string | null;
  driverName: string | null;
  driverPhone: string | null;
  ambulanceId: string | null;
  providerId: string | null;
  providerName: string | null;
  hospitalId: string | null;
  hospitalName: string | null;
};

export type DriverLocationCommand = {
  driverId: string;
  x: number;
  y: number;
};

export type DriverCommand = {
  driverId: string;
};

export type DriverShiftCommand = {
  driverId: string;
  onShift: boolean;
};

export type PatientHelpCommand = {
  patientId: string;
  x: number;
  y: number;
  patientSettings: PatientSettingsData;
};

export type PatientCancelCommand = {
  patientId: string;
  reason?: string;
};

export type EmtSubscribeCommand = {
  emtId: string;
  bookingId: string;
};

export type EmtAddNoteCommand = {
  emtId: string;
  bookingId: string;
  content: string;
};

export type EmtCurrentBookingResponse = {
  booking: {
    bookingId: string;
    status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
    patientProfileSnapshot: PatientSettingsData | null;
    emtNotes: EmtNote[];
  } | null;
};

export type EmtBookingSearchResult = {
  bookingId: string;
  shortId: string;
  status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
};

export type BookingDetailsPayload = {
  bookingId: string;
  status: BookingStatus;
  requestedAt: string | null;
  assignedAt: string | null;
  arrivedAt: string | null;
  pickedupAt: string | null;
  completedAt: string | null;
  cancellationReason: string | null;
  patient: {
    id: string | null;
    fullName: string | null;
    phoneNumber: string | null;
  };
  driver: {
    id: string | null;
    fullName: string | null;
    phoneNumber: string | null;
  };
  hospital: {
    id: string | null;
    name: string | null;
    phoneNumber: string | null;
  };
  provider: {
    id: string | null;
    name: string | null;
  };
  notes: BookingNote[];
};

export type DurationMetricSummary = {
  count: number;
  averageSeconds: number | null;
  medianSeconds: number | null;
  p90Seconds: number | null;
  minSeconds: number | null;
  maxSeconds: number | null;
};

export type DriverResponseMetricRow = {
  driverId: string | null;
  driverName: string | null;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  cancellationRate: number;
  dispatchLatency: DurationMetricSummary;
  responseTime: DurationMetricSummary;
  onSceneTime: DurationMetricSummary;
  transportTime: DurationMetricSummary;
  endToEndTime: DurationMetricSummary;
};

export type AnalyticsResponse = {
  providerId: string;
  from: string | null;
  to: string | null;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  completionRate: number;
  cancellationRate: number;
  dispatchLatency: DurationMetricSummary;
  responseTime: DurationMetricSummary;
  onSceneTime: DurationMetricSummary;
  transportTime: DurationMetricSummary;
  endToEndTime: DurationMetricSummary;
  drivers: DriverResponseMetricRow[];
};

export type ZoneGridCell = {
  key: string;
  center: Point;
  count: number;
  weight: number;
};

export type AnalyticsZones = {
  providerId: string;
  from: string | null;
  to: string | null;
  cellSizeDegrees: number;
  responseOrigins: ZoneGridCell[];
  hospitalDestinations: ZoneGridCell[];
};

export type FunnelStageMetric = {
  stage: "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";
  count: number;
  percentage: number;
};

export type CancellationReasonMetric = {
  reason: string;
  count: number;
  percentage: number;
};

export type TimeBucketMetric = {
  label: string;
  count: number;
};

export type HospitalChoiceMetric = {
  hospitalId: string;
  hospitalName: string;
  count: number;
  percentage: number;
};

export type AnalyticsInsights = {
  providerId: string;
  from: string | null;
  to: string | null;
  funnel: FunnelStageMetric[];
  cancellationReasons: CancellationReasonMetric[];
  demandByHour: TimeBucketMetric[];
  demandByWeekday: TimeBucketMetric[];
  hospitalChoices: HospitalChoiceMetric[];
  etaDeltaQuality: {
    available: false;
    note: string;
  } | null;
};

export type AnalyticsAiResponse = {
  answer: string;
  highlights: string[];
  generatedAt: string;
};

export type StartUploadSessionResponse = {
  uploadSessionId: string;
  expiresAt: string;
};

export type PatientBookingNoteResponse = {
  note: BookingNote;
};

export type UploadSessionFilesResponse = {
  notes: BookingNote[];
};

export type UploadSessionDraftFile = {
  attachment: BookingAttachment;
  content: string;
};
