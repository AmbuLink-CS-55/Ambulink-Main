// hooks/usePatientEvents.ts
import { BookingStatus, Point, User, Hospital, AmbulanceProvider } from "@ambulink/types";
import { useSocketEvent } from "./useSocketEvent";
import { Alert } from "react-native";

export const usePatientEvents = (
  setBooking: React.Dispatch<React.SetStateAction<any>>,
  setStatus: React.Dispatch<React.SetStateAction<BookingStatus>>,
  setIsCancelling: React.Dispatch<React.SetStateAction<boolean>>,
  setIsBooking: React.Dispatch<React.SetStateAction<boolean>>,
  setCompletedAt: React.Dispatch<React.SetStateAction<number | null>>
) => {
  useSocketEvent(
    "booking:assigned",
    (data: {
      patient: User;
      pickedDriver: User;
      provider: AmbulanceProvider;
      hospital: Hospital;
    }) => {
      if (!data) return;
      setBooking(data);
      setStatus("ASSIGNED");
      setIsBooking(false);
      setCompletedAt(null);
    }
  );

  useSocketEvent("driver:update", (point: Point) => {
    if (!point) return;
    setBooking((prev: any) =>
      prev
        ? {
            ...prev,
            pickedDriver: { ...prev.pickedDriver, currentLocation: point },
          }
        : null
    );
  });

  useSocketEvent("booking:arrived", () => {
    setStatus("ARRIVED");
    setIsBooking(false);
    setCompletedAt(null);
  });

  useSocketEvent("booking:completed", () => {
    setStatus("COMPLETED");
    setCompletedAt(Date.now());
    setIsBooking(false);
  });

  useSocketEvent("booking:cancelled", (data: { message: string }) => {
    if (!data) return;
    setBooking(null);
    setStatus("CANCELLED");
    setIsCancelling(false);
    setIsBooking(false);
    Alert.alert("Cancelled", data.message);
  });

  useSocketEvent("booking:cancel:error", (data: { message: string }) => {
    setIsCancelling(false);
    setIsBooking(false);
    Alert.alert("Error", data.message);
  });

  useSocketEvent(
    "booking:failed",
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
    }
  );
};
