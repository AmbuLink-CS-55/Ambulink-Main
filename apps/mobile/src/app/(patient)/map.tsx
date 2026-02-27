import React, { useEffect, useRef, useState } from "react";
import { Text, Alert, View, ActivityIndicator } from "react-native";
import UserMap from "@/components/patient/UserMap";
import MapOptions from "../../components/patient/MapOptions";
import { useLocation } from "@/hooks/useLocation";
import { usePatientEvents } from "@/hooks/usePatientEvents";
import { useNearbyHospitals } from "@/hooks/useNearbyHospitals";
import { useNearbyDrivers } from "@/hooks/useNearbyDrivers";
import { loadSettings } from "@/utils/settingsStorage";
import type { BookingStatus, User, Hospital, PatientSettingsData } from "@ambulink/types";
import { sendPatientCancel, sendPatientHelp } from "@/lib/patientEvents";
import { env } from "../../../env";
import { useSocket } from "@/hooks/SocketContext";
const PATIENT_BOOKING_TIMEOUT_MS = 40000;

export default function Map() {
  const socket = useSocket();
  const locationState = useLocation();
  const { hospitals: nearbyHospitals } = useNearbyHospitals({
    x: locationState.location?.x,
    y: locationState.location?.y,
    limit: 6,
    radiusKm: 12,
  });
  const { drivers: nearbyDrivers } = useNearbyDrivers({
    x: locationState.location?.x,
    y: locationState.location?.y,
    limit: 6,
  });

  const [status, setStatus] = useState<BookingStatus>("COMPLETED");
  const [isCancelling, setIsCancelling] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [completedAt, setCompletedAt] = useState<number | null>(null);
  const [booking, setBooking] = useState<{
    bookingId?: string | null;
    patient: User;
    pickedDriver: User;
    hospital: Hospital;
    provider?: { id: string; name: string; hotlineNumber?: string } | null;
  } | null>(null);
  const shouldShowNearbyMarkers = booking === null;

  const bookingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  usePatientEvents(socket, setBooking, setStatus, setIsCancelling, setIsBooking, setCompletedAt);

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
    const patientSettings = (await loadSettings()) as unknown as PatientSettingsData;
    if (!locationState?.location) return;

    setIsBooking(true);
    if (bookingTimeoutRef.current) {
      clearTimeout(bookingTimeoutRef.current);
    }
    bookingTimeoutRef.current = setTimeout(() => {
      setIsBooking(false);
      Alert.alert(
        "Request Taking Longer",
        "Your request is taking longer than expected. Please check your connection and try again."
      );
    }, PATIENT_BOOKING_TIMEOUT_MS);
    try {
      await sendPatientHelp({
        patientId: env.EXPO_PUBLIC_PATIENT_ID,
        x: locationState.location.x,
        y: locationState.location.y,
        patientSettings,
      });
    } catch (error) {
      setIsBooking(false);
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
        bookingTimeoutRef.current = null;
      }
      Alert.alert("Request Failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleCancel = () => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setIsCancelling(true);
          try {
            await sendPatientCancel({
              patientId: env.EXPO_PUBLIC_PATIENT_ID,
              reason: "Cancelled by patient",
            });
          } catch (error) {
            setIsCancelling(false);
            Alert.alert("Cancel Failed", error instanceof Error ? error.message : "Please try again.");
          }
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

  if (locationState?.error || !locationState?.location) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-red-500 font-semibold">Location Unavailable</Text>
        <Text className="mt-2 text-center text-gray-500">{locationState.error}</Text>
      </View>
    );
  }

  return (
    <UserMap
      driverLocations={
        booking?.pickedDriver?.currentLocation ? [booking.pickedDriver.currentLocation] : []
      }
      hospitalLocation={booking?.hospital?.location}
      bookingStatus={status}
      nearbyHospitals={shouldShowNearbyMarkers ? nearbyHospitals : []}
      nearbyDrivers={shouldShowNearbyMarkers ? nearbyDrivers : []}
      userLocation={
        booking?.patient?.currentLocation ?? {
          x: locationState.location.x,
          y: locationState.location.y,
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
