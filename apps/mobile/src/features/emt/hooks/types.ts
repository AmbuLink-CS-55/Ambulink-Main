import type {
  BookingAssignedPayload,
  BookingStatus,
  EmtBookingSearchResult,
  EmtNote,
  PatientSettingsData,
} from "@ambulink/types";

export type EmtActiveBooking = BookingAssignedPayload & {
  patientProfileSnapshot: PatientSettingsData | null;
  emtNotes: EmtNote[];
};

export type EmtBookingState = {
  activeBooking: EmtActiveBooking | null;
  bookingStatus: BookingStatus;
  searchTerm: string;
  bookingOptions: EmtBookingSearchResult[];
  isLoadingOptions: boolean;
  isRefreshingOptions: boolean;
  isSubscribing: boolean;
  errorMessage: string | null;
  setSearchTerm: (value: string) => void;
  clearTransientErrors: () => void;
  loadOptions: (opts?: { refresh?: boolean }) => Promise<void>;
  hydrateCurrentBooking: () => Promise<void>;
  selectAndSubscribe: (bookingId: string) => Promise<boolean>;
  submitNote: (content: string) => Promise<boolean>;
  submitMediaNote: (params: {
    content?: string;
    files: { uri: string; name: string; type: string }[];
    durationMs?: number;
  }) => Promise<boolean>;
  setAssignedBooking: (payload: BookingAssignedPayload) => void;
  setDriverLocation: (location: { x: number; y: number }) => void;
  setStatusOnly: (status: BookingStatus) => void;
  appendNote: (bookingId: string, note: EmtNote) => void;
  clearActiveBooking: (status: BookingStatus) => void;
};
