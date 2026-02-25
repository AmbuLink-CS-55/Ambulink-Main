// hooks/usePatientEvents.ts
import { BookingStatus, Point, User, Hospital } from "@ambulink/types";
import { Alert } from "react-native";
import { addBookingHistory } from "@/utils/bookingHistory";
import { useCallback, useEffect } from "react";
import { env } from "../../env";
import EventSource, { type EventSourceEvent } from "react-native-sse";

export const usePatientEvents = (
  setBooking: React.Dispatch<React.SetStateAction<any>>,
  setStatus: React.Dispatch<React.SetStateAction<BookingStatus>>,
  setIsCancelling: React.Dispatch<React.SetStateAction<boolean>>,
  setIsBooking: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletedAt: React.Dispatch<React.SetStateAction<number | null>>
) => {
  const onBookingAssigned = useCallback((data: {
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
    });
    setStatus(data.status);
    setIsBooking(false);
    setCompletedAt(null);
  }, [setBooking, setStatus, setIsBooking, setCompletedAt]);

  const onDriverUpdate = useCallback((point: Point) => {
    if (!point) return;
    setBooking((prev: any) =>
      prev
        ? {
            ...prev,
            pickedDriver: { ...prev.pickedDriver, currentLocation: point },
          }
        : null
    );
  }, [setBooking]);

  const onBookingArrived = useCallback(() => {
    setStatus("ARRIVED");
    setIsBooking(false);
    setCompletedAt(null);
  }, [setStatus, setIsBooking, setCompletedAt]);

  const onBookingCompleted = useCallback(() => {
    setStatus("COMPLETED");
    setBooking((prev: any) => {
      if (prev) {
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
  }, [setStatus, setBooking, setCompletedAt, setIsBooking]);

  const onBookingCancelled = useCallback((data: { message: string }) => {
    if (!data) return;
    setBooking((prev: any) => {
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
    Alert.alert("Cancelled", data.message);
  }, [setBooking, setStatus, setIsCancelling, setIsBooking]);

  const onBookingCancelError = useCallback((data: { message: string }) => {
    setIsCancelling(false);
    setIsBooking(false);
    Alert.alert("Error", data.message);
  }, [setIsCancelling, setIsBooking]);

  const onBookingFailed = useCallback((data: {
    reason: "no_drivers" | "no_dispatchers" | "all_rejected" | "error";
  }) => {
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
  }, [setIsBooking, setBooking, setCompletedAt]);

  useEffect(() => {
    const streamUrl = new URL("/api/patient-stream", env.EXPO_PUBLIC_API_SERVER_URL);
    streamUrl.searchParams.set("patientId", env.EXPO_PUBLIC_PATIENT_ID);
    const eventSource = new EventSource(streamUrl.toString());

    const safeParse = (raw: string | null) => {
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    };

    const addListener = (eventName: string, handler: (data: unknown) => void) => {
      eventSource.addEventListener(eventName, (event: EventSourceEvent<string>) => {
        const parsed = safeParse("data" in event ? event.data : null);
        if (parsed !== null) {
          handler(parsed);
        }
      });
    };

    addListener("booking:assigned", onBookingAssigned);
    addListener("driver:update", onDriverUpdate);
    addListener("booking:arrived", onBookingArrived);
    addListener("booking:completed", onBookingCompleted);
    addListener("booking:cancelled", onBookingCancelled);
    addListener("booking:cancel:error", onBookingCancelError);
    addListener("booking:failed", onBookingFailed);

    eventSource.addEventListener("error", () => {
      console.warn("[patient-sse] connection error");
    });

    return () => {
      eventSource.close();
    };
  }, [
    onBookingArrived,
    onBookingAssigned,
    onBookingCancelError,
    onBookingCancelled,
    onBookingCompleted,
    onBookingFailed,
    onDriverUpdate,
  ]);
};
