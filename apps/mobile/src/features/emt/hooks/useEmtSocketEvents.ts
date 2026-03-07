import { useEffect } from "react";
import { Alert } from "react-native";
import type {
  BookingAssignedPayload,
  DriverLocationUpdate,
  EmtNote,
  SocketErrorPayload,
} from "@ambulink/types";
import type { Socket } from "socket.io-client";
import { useEmtBookingState } from "./useEmtBookingState";

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
    };

    const onDriverUpdate = (payload: DriverLocationUpdate) => {
      setDriverLocation({ x: payload.x, y: payload.y });
    };

    const onArrived = () => {
      setStatusOnly("ARRIVED");
    };

    const onCompleted = () => {
      clearActiveBooking("COMPLETED");
      Alert.alert("Booking Completed", "The subscribed booking has been completed.");
    };

    const onCancelled = (payload: { reason?: string }) => {
      clearActiveBooking("CANCELLED");
      Alert.alert("Booking Cancelled", payload?.reason ?? "The subscribed booking was cancelled.");
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
    socket.on("booking:notes", onNotes);
    socket.on("socket:error", onSocketError);

    return () => {
      socket.off("booking:assigned", onAssigned);
      socket.off("driver:update", onDriverUpdate);
      socket.off("booking:arrived", onArrived);
      socket.off("booking:completed", onCompleted);
      socket.off("booking:cancelled", onCancelled);
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
