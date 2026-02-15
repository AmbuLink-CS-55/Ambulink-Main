import React, { useState } from "react";
import { Text, Alert } from "react-native";
import UserMap from "@/components/patient/UserMap";
import MapOptions from "../../components/patient/MapOptions";
import { useLocation } from "@/hooks/useLocation";
import { useSocket } from "@/hooks/SocketContext";
import { usePatientEvents } from "@/hooks/usePatientEvents";
import type { BookingStatus, User, Hospital } from "@ambulink/types";
import { loadSettings } from "@/utils/settingsStorage";

export default function Map() {
  const socket = useSocket();
  const locationState = useLocation();

  const [status, setStatus] = useState<BookingStatus>("COMPLETED");
  const [isCancelling, setIsCancelling] = useState(false);
  const [booking, setBooking] = useState<{
    patient: User;
    pickedDriver: User;
    hospital: Hospital;
  } | null>(null);

  usePatientEvents(setBooking, setStatus, setIsCancelling);

  const handleHelpRequest = async () => {
    // TODO: send this to server
    console.log(await loadSettings());
    if (!locationState?.location || !socket?.connected) return;
    socket.emit("patient:help", {
      x: locationState.location.longitude,
      y: locationState.location.latitude,
    });
  };

  const handleCancel = () => {
    if (!socket?.connected) return Alert.alert("Error", "Not connected");

    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: () => {
          setIsCancelling(true);
          socket.emit("patient:cancelled", { reason: "Cancelled by patient" });
        },
      },
    ]);
  };

  if (!locationState?.location?.latitude) return <Text>Loading</Text>;

  return (
    <UserMap
      driverLocations={
        booking?.pickedDriver?.currentLocation ? [booking.pickedDriver.currentLocation] : []
      }
      hospitalLocation={booking?.hospital?.location}
      userLocation={
        booking?.patient?.currentLocation ?? {
          x: locationState.location.longitude,
          y: locationState.location.latitude,
        }
      }
    >
      <MapOptions
        bookingAssigned={status !== "COMPLETED"}
        status={status}
        booking={booking}
        onHelpRequest={handleHelpRequest}
        cancelRequest={handleCancel}
        isCancelling={isCancelling}
      />
    </UserMap>
  );
}
