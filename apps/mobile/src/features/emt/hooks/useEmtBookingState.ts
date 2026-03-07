import { create } from "zustand";
import type { BookingAssignedPayload, BookingStatus, EmtNote } from "@ambulink/types";
import { env } from "../../../../env";
import { fetchEmtBookingOptions, fetchEmtCurrentBooking, postEmtNote, postEmtSubscribe } from "@/common/lib/emtEvents";
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
      const bookingOptions = await fetchEmtBookingOptions(env.EXPO_PUBLIC_EMT_ID);
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
      const booking = await fetchEmtCurrentBooking(env.EXPO_PUBLIC_EMT_ID);
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
      const assigned = await postEmtSubscribe({ bookingId, emtId: env.EXPO_PUBLIC_EMT_ID });
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
      const created = await postEmtNote({
        bookingId: booking.bookingId,
        content: trimmed,
        emtId: env.EXPO_PUBLIC_EMT_ID,
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
