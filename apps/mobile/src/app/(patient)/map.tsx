import React, { useEffect, useRef, useState } from "react";
import { Text, Alert, View, ActivityIndicator } from "react-native";
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
  const [isBooking, setIsBooking] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [booking, setBooking] = useState<{
    patient: User;
    pickedDriver: User;
    hospital: Hospital;
  } | null>(null);

  const bookingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  usePatientEvents(setBooking, setStatus, setIsCancelling, setIsBooking, setCompletedAt);

  useEffect(() => {
    return () => {
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isBooking && bookingTimeoutRef.current) {
      clearTimeout(bookingTimeoutRef.current);
      bookingTimeoutRef.current = null;
    }
  }, [isBooking]);

  useEffect(() => {
    if (completedAt === null) return;
    const timer = setTimeout(() => {
      setCompletedAt(null);
    }, 8000);
    return () => clearTimeout(timer);
  }, [completedAt]);

  const handleHelpRequest = async () => {
    // TODO: send this to server
    const patientSettings = await loadSettings();
    if (!locationState?.location || !socket?.connected) return;
    setIsBooking(true);
    if (bookingTimeoutRef.current) {
      clearTimeout(bookingTimeoutRef.current);
    }
    bookingTimeoutRef.current = setTimeout(() => {
      setIsBooking(false);
      Alert.alert("Booking Timeout", "We couldn't confirm your request. Please try again.");
    }, 20000);
    socket.emit("patient:help", {
      x: locationState.location.longitude,
      y: locationState.location.latitude,
      patientSettings: patientSettings,
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

  if (locationState?.loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="mt-4 text-gray-500">Getting your location...</Text>
      </View>
    );
  }

  if (locationState?.error) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-red-500 font-semibold">Location Unavailable</Text>
        <Text className="mt-2 text-center text-gray-500">
          {locationState.error}
        </Text>
      </View>
    );
  }

  if (!locationState?.location?.latitude) return <Text>Location unavailable</Text>;

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
        isBooking={isBooking}
        completedAt={completedAt}
      />
    </UserMap>
  );
}
