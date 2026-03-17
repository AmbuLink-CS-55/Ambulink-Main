import { useEffect } from "react";
import { Alert } from "react-native";
import type {
  BookingAssignedPayload,
  BookingEtaUpdatedPayload,
  BookingReroutedPayload,
  DriverLocationUpdate,
  EmtNote,
  SocketErrorPayload,
} from "@ambulink/types";
import type { Socket } from "socket.io-client";
import { useEmtBookingState } from "./useEmtBookingState";
import { notifyFromSocket } from "@/common/notifications/service";

export const useEmtSocketEvents = (socket: Socket | null) => {
  const setAssignedBooking = useEmtBookingState((state) => state.setAssignedBooking);
  const setDriverLocation = useEmtBookingState((state) => state.setDriverLocation);
  const setStatusOnly = useEmtBookingState((state) => state.setStatusOnly);
  const appendNote = useEmtBookingState((state) => state.appendNote);
  const clearActiveBooking = useEmtBookingState((state) => state.clearActiveBooking);

  useEffect(() => {
    if (!socket) return;

    const onAssigned = (payload: BookingAssignedPayload) => {
      setAssignedBooking(payload);
      if (payload.bookingId) {
        notifyFromSocket("EMT", {
          type: "ASSIGNED",
          bookingId: payload.bookingId,
        }).catch((error) => console.warn("[notifications] emt ASSIGNED failed", error));
      }
    };

    const onDriverUpdate = (payload: DriverLocationUpdate) => {
      setDriverLocation({ x: payload.x, y: payload.y });
    };

    const onArrived = () => {
      const bookingId = useEmtBookingState.getState().activeBooking?.bookingId;
      if (bookingId) {
        notifyFromSocket("EMT", {
          type: "ARRIVED",
          bookingId,
        }).catch((error) => console.warn("[notifications] emt ARRIVED failed", error));
      }
      setStatusOnly("ARRIVED");
    };

    const onCompleted = () => {
      clearActiveBooking("COMPLETED");
      Alert.alert("Booking Completed", "The subscribed booking has been completed.");
    };

    const onCancelled = (payload: { reason?: string }) => {
      const bookingId = useEmtBookingState.getState().activeBooking?.bookingId;
      if (bookingId) {
        notifyFromSocket("EMT", {
          type: "CANCELLED",
          bookingId,
          reason: payload?.reason,
        }).catch((error) => console.warn("[notifications] emt CANCELLED failed", error));
      }
      clearActiveBooking("CANCELLED");
      Alert.alert("Booking Cancelled", payload?.reason ?? "The subscribed booking was cancelled.");
    };

    const onEtaUpdated = (payload: BookingEtaUpdatedPayload) => {
      if (!payload.bookingId) return;
      notifyFromSocket("EMT", {
        type: "ETA_UPDATED",
        bookingId: payload.bookingId,
        etaMinutes: payload.etaMinutes,
        previousEtaMinutes: payload.previousEtaMinutes,
      }).catch((error) => console.warn("[notifications] emt ETA_UPDATED failed", error));
    };

    const onRerouted = (payload: BookingReroutedPayload) => {
      if (!payload.bookingId) return;
      notifyFromSocket("EMT", {
        type: "REROUTED",
        bookingId: payload.bookingId,
        reason: payload.reason,
      }).catch((error) => console.warn("[notifications] emt REROUTED failed", error));
    };

    const onNotes = (payload: { bookingId: string; note: EmtNote }) => {
      appendNote(payload.bookingId, payload.note);
    };

    const onSocketError = (payload: SocketErrorPayload) => {
      Alert.alert("Socket Error", payload.message);
    };

    socket.on("booking:assigned", onAssigned);
    socket.on("driver:update", onDriverUpdate);
    socket.on("booking:arrived", onArrived);
    socket.on("booking:completed", onCompleted);
    socket.on("booking:cancelled", onCancelled);
    socket.on("booking:eta-updated", onEtaUpdated);
    socket.on("booking:rerouted", onRerouted);
    socket.on("booking:notes", onNotes);
    socket.on("socket:error", onSocketError);

    return () => {
      socket.off("booking:assigned", onAssigned);
      socket.off("driver:update", onDriverUpdate);
      socket.off("booking:arrived", onArrived);
      socket.off("booking:completed", onCompleted);
      socket.off("booking:cancelled", onCancelled);
      socket.off("booking:eta-updated", onEtaUpdated);
      socket.off("booking:rerouted", onRerouted);
      socket.off("booking:notes", onNotes);
      socket.off("socket:error", onSocketError);
    };
  }, [
    appendNote,
    clearActiveBooking,
    setAssignedBooking,
    setDriverLocation,
    setStatusOnly,
    socket,
  ]);
};
