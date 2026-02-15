// hooks/usePatientEvents.ts
import { BookingStatus, Point, User, Hospital } from "@ambulink/types";
import { useSocketEvent } from "./useSocketEvent";
import { Alert } from "react-native";

export const usePatientEvents = (
  setBooking: React.Dispatch<React.SetStateAction<any>>,
  setStatus: React.Dispatch<React.SetStateAction<BookingStatus>>,
  setIsCancelling: React.Dispatch<React.SetStateAction<boolean>>
) => {
  useSocketEvent(
    "booking:assigned",
    (data: { patient: User; pickedDriver: User; hospital: Hospital }) => {
      if (!data) return;
      setBooking(data);
      setStatus("ASSIGNED");
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

  useSocketEvent("booking:arrived", () => setStatus("ARRIVED"));

  useSocketEvent("booking:completed", () => setStatus("COMPLETED"));

  useSocketEvent("booking:cancelled", (data: { message: string }) => {
    if (!data) return;
    setBooking(null);
    setStatus("CANCELLED");
    setIsCancelling(false);
    Alert.alert("Cancelled", data.message);
  });

  useSocketEvent("booking:cancel:error", (data: { message: string }) => {
    setIsCancelling(false);
    Alert.alert("Error", data.message);
  });
};
