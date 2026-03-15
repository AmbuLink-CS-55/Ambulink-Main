import { create } from "zustand";
import type { BookingAssignedPayload, BookingStatus, EmtNote } from "@ambulink/types";
import {
  fetchEmtBookingOptions,
  fetchEmtCurrentBooking,
  postEmtNote,
  postEmtSubscribe,
} from "@/common/lib/emtEvents";
import { getAuthUser } from "@/common/hooks/AuthContext";
import type { EmtActiveBooking, EmtBookingState } from "./types";

const toActiveBooking = (payload: BookingAssignedPayload): EmtActiveBooking => ({
  ...payload,
  patientProfileSnapshot: payload.patientProfileSnapshot ?? null,
  emtNotes: payload.emtNotes ?? [],
});

export const useEmtBookingState = create<EmtBookingState>((set, get) => ({
  activeBooking: null,
  bookingStatus: "COMPLETED",
  searchTerm: "",
  bookingOptions: [],
  isLoadingOptions: false,
  isRefreshingOptions: false,
  isSubscribing: false,
  errorMessage: null,

  setSearchTerm: (value) => set({ searchTerm: value }),

  clearTransientErrors: () => set({ errorMessage: null }),

  loadOptions: async (opts) => {
    const isRefresh = opts?.refresh ?? false;
    set({ isLoadingOptions: !isRefresh, isRefreshingOptions: isRefresh, errorMessage: null });

    try {
      const emtId = getAuthUser()?.id;
      if (!emtId) {
        set({ bookingOptions: [] });
        return;
      }
      const bookingOptions = await fetchEmtBookingOptions(emtId);
      set({ bookingOptions });
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Failed to load active booking options.",
      });
    } finally {
      set({ isLoadingOptions: false, isRefreshingOptions: false });
    }
  },

  hydrateCurrentBooking: async () => {
    try {
      const emtId = getAuthUser()?.id;
      if (!emtId) {
        set({ activeBooking: null, bookingStatus: "COMPLETED" });
        return;
      }
      const booking = await fetchEmtCurrentBooking(emtId);
      if (!booking) {
        set({ activeBooking: null, bookingStatus: "COMPLETED" });
        return;
      }

      const activeBooking = toActiveBooking(booking);
      set({
        activeBooking,
        bookingStatus: booking.status,
      });
    } catch (error) {
      set({
        errorMessage:
          error instanceof Error ? error.message : "Failed to load current EMT booking state.",
      });
    }
  },

  selectAndSubscribe: async (bookingId) => {
    set({ isSubscribing: true, errorMessage: null });
    try {
      const emtId = getAuthUser()?.id;
      if (!emtId) {
        set({ errorMessage: "EMT session is required." });
        return false;
      }
      const assigned = await postEmtSubscribe({ bookingId, emtId });
      const activeBooking = toActiveBooking(assigned);
      set({
        activeBooking,
        bookingStatus: assigned.status,
      });
      return true;
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : "Failed to subscribe to booking.",
      });
      return false;
    } finally {
      set({ isSubscribing: false });
    }
  },

  submitNote: async (content) => {
    const trimmed = content.trim();
    if (!trimmed) {
      set({ errorMessage: "Please enter a note before sending." });
      return false;
    }

    const booking = get().activeBooking;
    if (!booking?.bookingId) {
      set({ errorMessage: "No active booking selected." });
      return false;
    }

    try {
      const emtId = getAuthUser()?.id;
      if (!emtId) {
        set({ errorMessage: "EMT session is required." });
        return false;
      }
      const created = await postEmtNote({
        bookingId: booking.bookingId,
        content: trimmed,
        emtId,
      });

      get().appendNote(booking.bookingId, created);
      return true;
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : "Failed to submit note.",
      });
      return false;
    }
  },

  submitMediaNote: async ({ content, files, durationMs }) => {
    const booking = get().activeBooking;
    if (!booking?.bookingId) {
      set({ errorMessage: "No active booking selected." });
      return false;
    }

    const hasContent = Boolean(content && content.trim().length > 0);
    if (!hasContent && files.length === 0) {
      set({ errorMessage: "Please add a note or at least one file." });
      return false;
    }

    try {
      const emtId = getAuthUser()?.id;
      if (!emtId) {
        set({ errorMessage: "EMT session is required." });
        return false;
      }
      const created = await postEmtNote({
        bookingId: booking.bookingId,
        content: content?.trim(),
        files,
        durationMs,
        emtId,
      });

      get().appendNote(booking.bookingId, created);
      return true;
    } catch (error) {
      set({
        errorMessage: error instanceof Error ? error.message : "Failed to submit media note.",
      });
      return false;
    }
  },

  setAssignedBooking: (payload) => {
    const activeBooking = toActiveBooking(payload);
    set({
      activeBooking,
      bookingStatus: payload.status,
    });
  },

  setDriverLocation: (location) => {
    const booking = get().activeBooking;
    if (!booking) return;

    set({
      activeBooking: {
        ...booking,
        driver: {
          ...booking.driver,
          location,
        },
      },
    });
  },

  setStatusOnly: (status: BookingStatus) => {
    const booking = get().activeBooking;
    if (!booking) {
      set({ bookingStatus: status });
      return;
    }

    set({
      bookingStatus: status,
      activeBooking: {
        ...booking,
        status:
          status === "ASSIGNED" || status === "ARRIVED" || status === "PICKEDUP"
            ? status
            : booking.status,
      },
    });
  },

  appendNote: (bookingId: string, note: EmtNote) => {
    const booking = get().activeBooking;
    if (!booking || booking.bookingId !== bookingId) return;
    if (booking.emtNotes.some((item) => item.id === note.id)) return;

    set({
      activeBooking: {
        ...booking,
        emtNotes: [note, ...booking.emtNotes],
      },
    });
  },

  clearActiveBooking: (status) => {
    set({
      activeBooking: null,
      bookingStatus: status,
      searchTerm: "",
    });
  },
}));
