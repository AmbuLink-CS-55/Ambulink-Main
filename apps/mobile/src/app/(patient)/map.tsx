import UserMap from "@/components/patient/UserMap";
import { useEffect, useState } from "react";
import { Text, Alert } from "react-native";
import { useLocation } from "@/hooks/useLocation";
import MapOptions from "../../components/patient/MapOptions";
import { useSocket } from "@/hooks/SocketContext";

type LatLng = { lat: number; lng: number };

type BookingResponse = {
  id: number;
  patient: {
    id: string;
    phone_number: string;
    name: string | null;
    lat: number;
    lng: number;
  };
  driver: {
    id: string;
    phone_number: string;
    lat: number;
    lng: number;
    ambulance_provider: {
      id: string;
      name: string;
    };
  };
  hospital: {
    id: string;
    name: string;
    phone_number: string;
    lat: number;
    lng: number;
  };
};

type BookingStatus = "idle" | "assigned" | "arrived" | "completed";

export default function Map() {
  const locationState = useLocation();
  const socket = useSocket();
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [status, setStatus] = useState<BookingStatus>("idle");
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => console.log("ws Connected"));

    socket.on("booking:assigned", (data: BookingResponse) => {
      console.log("booking:assigned", data);
      setBooking(data);
      setStatus("assigned");
    });

    socket.on("driver:location", (data: LatLng) => {
      setBooking((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          driver: {
            ...prev.driver,
            lat: data.lat,
            lng: data.lng,
          },
        };
      });
    });

    socket.on("booking:arrived", () => {
      console.log("booking:arrived");
      setStatus("arrived");
    });

    socket.on("booking:completed", () => {
      console.log("booking:completed");
      setStatus("completed");
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    });

    // Handle cancellation confirmation from backend
    socket.on(
      "booking:cancelled",
      (data: { bookingId: string; message: string }) => {
        console.log("booking:cancelled", data);
        setBooking(null);
        setStatus("idle");
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
      lat: locationState.location.latitude,
      lng: locationState.location.longitude,
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
        booking ? [{ lat: booking.driver.lat, lng: booking.driver.lng }] : []
      }
      hospitalLocation={
        booking
          ? {
              lat: booking.hospital.lat,
              lng: booking.hospital.lng,
            }
          : undefined
      }
      userLocation={{
        lat: locationState.location.latitude,
        lng: locationState.location.longitude,
      }}
    >
      <MapOptions
        bookingAssigned={status !== "idle"}
        status={status}
        booking={booking}
        onHelpRequest={handleHelpRequest}
        cancelRequest={handleCancel}
        isCancelling={isCancelling}
      />
    </UserMap>
  );
}
