import {
  BookingStatus,
  Point,
  User,
  Hospital,
  BookingNote,
  BookingEtaUpdatedPayload,
  BookingReroutedPayload,
  type PatientSettingsData,
} from "@ambulink/types";
import { Alert, Linking } from "react-native";
import { addBookingHistory } from "@/common/utils/bookingHistory";
import { useCallback, useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import { notifyFromSocket } from "@/common/notifications/service";

export const usePatientEvents = (
  socket: Socket | null,
  setBooking: React.Dispatch<React.SetStateAction<PatientBooking | null>>,
  setStatus: React.Dispatch<React.SetStateAction<BookingStatus>>,
  setIsCancelling: React.Dispatch<React.SetStateAction<boolean>>,
  setIsBooking: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletedAt: React.Dispatch<React.SetStateAction<number | null>>,
  appendNote: (bookingId: string, note: BookingNote) => void,
  patientLocation: Point | null,
  emergencyContacts: PatientSettingsData["emergencyContacts"]
) => {
  const lastCompletedBookingIdRef = useRef<string | null>(null);

  const sendLocationToEmergencyContacts = useCallback(
    async (location: Point, contacts: PatientSettingsData["emergencyContacts"]) => {
      const sanitizePhone = (input: string) => input.trim().replace(/[^\d+]/g, "");
      const recipients = contacts
        .map((c) => {
          const number = sanitizePhone(c.number ?? "");
          return { number, name: c.name ?? "" };
        })
        .filter(({ number, name }) => {
          if (!number) return false;
          if (number === "119") return false; // Default Police hotline
          if (name.trim().toLowerCase() === "police") return false;
          return true;
        })
        .map(({ number }) => number);

      if (recipients.length === 0) return;

      // Note: our app stores `x=longitude` and `y=latitude`.
      const mapsUrl = `https://maps.google.com/?q=${location.y},${location.x}`;
      const body = encodeURIComponent(`Ambulink: Booking completed. Location: ${mapsUrl}`);
      const smsUri = `sms:${recipients.join(";")}?body=${body}`;

      try {
        const supported = await Linking.canOpenURL(smsUri);
        if (supported) {
          await Linking.openURL(smsUri);
          return;
        }

        // Fallback: open map link so user can share manually.
        const mapSupported = await Linking.canOpenURL(mapsUrl);
        if (mapSupported) await Linking.openURL(mapsUrl);
      } catch {
        Alert.alert("Error", "Unable to send location to emergency contacts.");
      }
    },
    []
  );

  const onBookingAssigned = useCallback(
    (data: {
      bookingId: string | null;
      status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
      patient: {
        id: string;
        fullName: string | null;
        phoneNumber: string | null;
        location: Point | null;
      };
      driver: {
        id: string;
        fullName: string | null;
        phoneNumber: string | null;
        location: Point | null;
        provider: { id: string; name: string } | null;
      };
      hospital: {
        id: string;
        name: string | null;
        phoneNumber: string | null;
        location: Point | null;
      };
      provider: { id: string; name: string; hotlineNumber: string | null } | null;
      emtNotes?: BookingNote[];
    }) => {
      if (!data) return;
      setBooking({
        bookingId: data.bookingId ?? null,
        patient: {
          id: data.patient.id,
          fullName: data.patient.fullName ?? undefined,
          phoneNumber: data.patient.phoneNumber ?? undefined,
          currentLocation: data.patient.location ?? undefined,
        } as User,
        pickedDriver: {
          id: data.driver.id,
          fullName: data.driver.fullName ?? undefined,
          phoneNumber: data.driver.phoneNumber ?? undefined,
          currentLocation: data.driver.location ?? undefined,
          providerId: data.driver.provider?.id ?? undefined,
        } as User,
        hospital: {
          id: data.hospital.id,
          name: data.hospital.name ?? undefined,
          phoneNumber: data.hospital.phoneNumber ?? undefined,
          location: data.hospital.location ?? undefined,
        } as Hospital,
        provider: data.provider
          ? {
              id: data.provider.id,
              name: data.provider.name,
              hotlineNumber: data.provider.hotlineNumber ?? undefined,
            }
          : null,
        notes: data.emtNotes ?? [],
      });
      setStatus(data.status);
      setIsBooking(false);
      setCompletedAt(null);
      if (data.bookingId) {
        lastCompletedBookingIdRef.current = null;
        notifyFromSocket("PATIENT", {
          type: "ASSIGNED",
          bookingId: data.bookingId,
        }).catch((error) => console.warn("[notifications] patient ASSIGNED failed", error));
      }
    },
    [setBooking, setStatus, setIsBooking, setCompletedAt]
  );

  const onDriverUpdate = useCallback(
    (point: Point) => {
      if (!point) return;
      setBooking((prev) =>
        prev
          ? {
              ...prev,
              pickedDriver: { ...prev.pickedDriver, currentLocation: point },
            }
          : null
      );
    },
    [setBooking]
  );

  const onBookingArrived = useCallback(() => {
    setBooking((prev) => {
      if (!prev?.bookingId) return prev;
      notifyFromSocket("PATIENT", {
        type: "ARRIVED",
        bookingId: prev.bookingId,
      }).catch((error) => console.warn("[notifications] patient ARRIVED failed", error));
      return prev;
    });
    setStatus("ARRIVED");
    setIsBooking(false);
    setCompletedAt(null);
  }, [setStatus, setIsBooking, setCompletedAt, setBooking]);

  const onBookingCompleted = useCallback(() => {
    let completedBookingId: string | null = null;
    setStatus("COMPLETED");
    setBooking((prev) => {
      if (prev) {
        completedBookingId = prev.bookingId ?? null;
        addBookingHistory("PATIENT", {
          id: `${Date.now()}:${prev.patient?.id ?? "patient"}`,
          bookingId: prev.bookingId ?? null,
          role: "PATIENT",
          status: "COMPLETED",
          patientName: prev.patient?.fullName ?? null,
          driverName: prev.pickedDriver?.fullName ?? null,
          hospitalName: prev.hospital?.name ?? null,
          providerName: prev.provider?.name ?? null,
          providerHotline: prev.provider?.hotlineNumber ?? null,
          createdAt: new Date().toISOString(),
        });
      }
      return null;
    });
    setCompletedAt(Date.now());
    setIsBooking(false);

    if (!completedBookingId) return;
    if (completedBookingId === lastCompletedBookingIdRef.current) return;
    lastCompletedBookingIdRef.current = completedBookingId;

    if (!patientLocation) return;
    if (!emergencyContacts?.length) return;

    void sendLocationToEmergencyContacts(patientLocation, emergencyContacts);
  }, [
    setStatus,
    setBooking,
    setCompletedAt,
    setIsBooking,
    patientLocation,
    emergencyContacts,
    sendLocationToEmergencyContacts,
  ]);

  const onBookingCancelled = useCallback(
    (data: { bookingId?: string; message: string }) => {
      if (!data) return;
      setBooking((prev) => {
        if (prev) {
          addBookingHistory("PATIENT", {
            id: `${Date.now()}:${prev.patient?.id ?? "patient"}`,
            bookingId: prev.bookingId ?? null,
            role: "PATIENT",
            status: "CANCELLED",
            patientName: prev.patient?.fullName ?? null,
            driverName: prev.pickedDriver?.fullName ?? null,
            hospitalName: prev.hospital?.name ?? null,
            providerName: prev.provider?.name ?? null,
            providerHotline: prev.provider?.hotlineNumber ?? null,
            createdAt: new Date().toISOString(),
          });
        }
        return null;
      });
      setStatus("CANCELLED");
      setIsCancelling(false);
      setIsBooking(false);
      if (data.bookingId) {
        notifyFromSocket("PATIENT", {
          type: "CANCELLED",
          bookingId: data.bookingId,
          reason: data.message,
        }).catch((error) => console.warn("[notifications] patient CANCELLED failed", error));
      }
      Alert.alert("Cancelled", data.message);
    },
    [setBooking, setStatus, setIsCancelling, setIsBooking]
  );

  const onBookingCancelError = useCallback(
    (data: { message: string }) => {
      setIsCancelling(false);
      setIsBooking(false);
      Alert.alert("Error", data.message);
    },
    [setIsCancelling, setIsBooking]
  );

  const onBookingFailed = useCallback(
    (data: { reason: "no_drivers" | "no_dispatchers" | "all_rejected" | "error" }) => {
      setIsBooking(false);
      setBooking(null);
      setCompletedAt(null);
      const message = (() => {
        switch (data?.reason) {
          case "no_drivers":
            return "No ambulances are available nearby. Please try again shortly.";
          case "no_dispatchers":
          case "all_rejected":
            return "No dispatchers are available to handle your request right now. Please try again.";
          default:
            return "Something went wrong. Please try again.";
        }
      })();
      Alert.alert("Request Unavailable", message);
    },
    [setIsBooking, setBooking, setCompletedAt]
  );

  const onBookingNotes = useCallback(
    (payload: { bookingId: string; note: BookingNote }) => {
      if (!payload?.bookingId || !payload.note) return;
      appendNote(payload.bookingId, payload.note);
    },
    [appendNote]
  );

  const onEtaUpdated = useCallback((payload: BookingEtaUpdatedPayload) => {
    if (!payload?.bookingId) return;
    notifyFromSocket("PATIENT", {
      type: "ETA_UPDATED",
      bookingId: payload.bookingId,
      etaMinutes: payload.etaMinutes,
      previousEtaMinutes: payload.previousEtaMinutes,
    }).catch((error) => console.warn("[notifications] patient ETA_UPDATED failed", error));
  }, []);

  const onRerouted = useCallback((payload: BookingReroutedPayload) => {
    if (!payload?.bookingId) return;
    notifyFromSocket("PATIENT", {
      type: "REROUTED",
      bookingId: payload.bookingId,
      reason: payload.reason,
    }).catch((error) => console.warn("[notifications] patient REROUTED failed", error));
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("booking:assigned", onBookingAssigned);
    socket.on("driver:update", onDriverUpdate);
    socket.on("booking:arrived", onBookingArrived);
    socket.on("booking:completed", onBookingCompleted);
    socket.on("booking:cancelled", onBookingCancelled);
    socket.on("booking:cancel:error", onBookingCancelError);
    socket.on("booking:failed", onBookingFailed);
    socket.on("booking:notes", onBookingNotes);
    socket.on("booking:eta-updated", onEtaUpdated);
    socket.on("booking:rerouted", onRerouted);

    return () => {
      socket.off("booking:assigned", onBookingAssigned);
      socket.off("driver:update", onDriverUpdate);
      socket.off("booking:arrived", onBookingArrived);
      socket.off("booking:completed", onBookingCompleted);
      socket.off("booking:cancelled", onBookingCancelled);
      socket.off("booking:cancel:error", onBookingCancelError);
      socket.off("booking:failed", onBookingFailed);
      socket.off("booking:notes", onBookingNotes);
      socket.off("booking:eta-updated", onEtaUpdated);
      socket.off("booking:rerouted", onRerouted);
    };
  }, [
    socket,
    onBookingArrived,
    onBookingAssigned,
    onBookingCancelError,
    onBookingCancelled,
    onBookingCompleted,
    onBookingFailed,
    onBookingNotes,
    onEtaUpdated,
    onRerouted,
    onDriverUpdate,
  ]);
};

type PatientBooking = {
  bookingId?: string | null;
  patient: User;
  pickedDriver: User;
  hospital: Hospital;
  provider?: { id: string; name: string; hotlineNumber?: string } | null;
  notes?: BookingNote[];
};
