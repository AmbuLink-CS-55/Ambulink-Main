import UserMap from "@/components/patient/UserMap";
import { useEffect, useState } from "react";
import { Text, Alert } from "react-native";
import { useLocation } from "@/hooks/useLocation";
import MapOptions from "../../components/patient/MapOptions";
import { useSocket } from "@/hooks/SocketContext";
import type { Point, Booking, BookingStatus, User, Hospital } from "@ambulink/types";

export default function Map() {
  const locationState = useLocation();
  const socket = useSocket();
  const [booking, setBooking] = useState<{patient: User, pickedDriver: User, hospital: Hospital} | null>(null);
  const [status, setStatus] = useState<BookingStatus>("COMPLETED");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => console.log("ws Connected"));

    socket.on("booking:assigned", (data: {patient: User, pickedDriver: User, hospital: Hospital}) => {
      console.log("booking:assigned", data);
      setBooking(data);
      setStatus("ASSIGNED");
    });

    socket.on("driver:location", (data: Point) => {
      setBooking((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          pickedDriver: {
            ...prev.pickedDriver,
            currentLocation: data
          },
        };
      });
    });

    socket.on("booking:arrived", () => {
      console.log("booking:arrived");
      setStatus("ARRIVED");
    });

    socket.on("booking:completed", () => {
      console.log("booking:completed");
      setStatus("COMPLETED");
      // setTimeout(() => {
      //   setStatus("idle");
      // }, 5000);
    });

    // Handle cancellation confirmation from backend
    socket.on(
      "booking:cancelled",
      (data: { bookingId: string; message: string }) => {
        console.log("booking:cancelled", data);
        setBooking(null);
        setStatus("CANCELLED");
        setIsCancelling(false);
        Alert.alert(
          "Cancelled",
          data.message || "Booking cancelled successfully",
        );
      },
    );

    // Handle cancellation errors
    socket.on("booking:cancel:error", (data: { message: string }) => {
      console.error("booking:cancel:error", data);
      setIsCancelling(false);
      Alert.alert("Error", data.message || "Failed to cancel booking");
    });
  }, [socket]);

  const handleHelpRequest = () => {
    if (!locationState?.location || !socket?.connected) {
      console.log("Location or socket not ready");
      return;
    }
    socket.emit("patient:help", {
      x: locationState.location.latitude,
      y: locationState.location.longitude,
    });
  };

  const handleCancel = () => {
    if (!socket?.connected) {
      Alert.alert("Error", "Not connected to server");
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      "Cancel Booking",
      "Are you sure you want to cancel this booking?",
      [
        {
          text: "No",
          style: "cancel",
        },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: () => {
            setIsCancelling(true);
            socket.emit("patient:cancelled", {
              reason: "Cancelled by patient",
            });
          },
        },
      ],
    );
  };

  if (!locationState?.location?.latitude) {
    return <Text>Loading</Text>;
  }

  return (
    <UserMap
      driverLocations={
        booking?.pickedDriver.currentLocation ? [booking.pickedDriver.currentLocation] : []
      }
      hospitalLocation={
        booking?.hospital.location ? booking.hospital.location : undefined
      }
      userLocation={
        booking?.patient.currentLocation ? booking.patient.currentLocation : {x: locationState.location.latitude, y: locationState.location.longitude}
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
