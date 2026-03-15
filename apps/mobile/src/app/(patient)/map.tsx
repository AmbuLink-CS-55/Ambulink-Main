import React, { useCallback, useEffect, useRef, useState } from "react";
import { Text, Alert, View, ActivityIndicator } from "react-native";
import MapOptions from "@/features/patient/components/MapOptions";
import PatientChatModal from "@/features/patient/components/PatientChatModal";
import UserMap from "@/features/patient/components/UserMap";
import { useLocation } from "@/common/hooks/useLocation";
import { usePatientEvents } from "@/features/patient/hooks/usePatientEvents";
import { useNearbyHospitals } from "@/features/patient/hooks/useNearbyHospitals";
import { useNearbyDrivers } from "@/features/patient/hooks/useNearbyDrivers";
import { loadSettings } from "@/common/utils/settingsStorage";
import type {
  BookingNote,
  BookingStatus,
  User,
  Hospital,
  PatientSettingsData,
} from "@ambulink/types";
import {
  sendPatientCancel,
  sendPatientHelp,
  startPatientUploadSession,
  submitPatientMediaNote,
} from "@/common/lib/patientEvents";
import { useSocket } from "@/common/hooks/SocketContext";
import { startGuestBooking } from "@/common/lib/staffAuth";
import { useAuthStore } from "@/common/hooks/AuthContext";
const PATIENT_BOOKING_TIMEOUT_MS = 40000;

export default function Map() {
  const socket = useSocket();
  const user = useAuthStore((state) => state.user);
  const session = useAuthStore((state) => state.session);
  const signInPatientGuest = useAuthStore((state) => state.signInPatientGuest);
  const clearPatientSession = useAuthStore((state) => state.clearPatientSession);
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
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  const [isChatOpen, setChatOpen] = useState(false);
  const [isChatSending, setChatSending] = useState(false);
  const [booking, setBooking] = useState<{
    bookingId?: string | null;
    patient: User;
    pickedDriver: User;
    hospital: Hospital;
    provider?: { id: string; name: string; hotlineNumber?: string } | null;
    notes?: BookingNote[];
  } | null>(null);
  const shouldShowNearbyMarkers = booking === null;

  const bookingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const appendPatientNote = useCallback((bookingId: string, note: BookingNote) => {
    setBooking((prev) => {
      if (!prev || prev.bookingId !== bookingId) return prev;
      const existing = prev.notes ?? [];
      if (existing.some((entry) => entry.id === note.id)) return prev;
      return {
        ...prev,
        notes: [note, ...existing],
      };
    });
  }, []);

  usePatientEvents(
    socket,
    setBooking,
    setStatus,
    setIsCancelling,
    setIsBooking,
    setCompletedAt,
    appendPatientNote
  );

  useEffect(() => {
    return () => {
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isCancelling) {
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
        cancelTimeoutRef.current = null;
      }
      return;
    }

    if (status === "CANCELLED") {
      setIsCancelling(false);
      if (cancelTimeoutRef.current) {
        clearTimeout(cancelTimeoutRef.current);
        cancelTimeoutRef.current = null;
      }
    }
  }, [isCancelling, status]);

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
    const needsGuestBootstrap = !session?.accessToken || !user?.id || user.id === "demo";
    if (needsGuestBootstrap) {
      try {
        const started = await startGuestBooking({
          x: locationState.location.x,
          y: locationState.location.y,
          patientSettings,
        });
        await signInPatientGuest({
          patient: started.patient,
          accessToken: started.accessToken,
          expiresInSeconds: started.expiresInSeconds,
        });
      } catch (error) {
        setIsBooking(false);
        Alert.alert("Request Failed", error instanceof Error ? error.message : "Please try again.");
      }
      return;
    }

    if (!uploadSessionId) {
      try {
        const uploadSession = await startPatientUploadSession();
        setUploadSessionId(uploadSession.uploadSessionId);
      } catch {
        // Session creation is best-effort; uploads can still start later from composer.
      }
    }
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
        patientId: user?.id ?? "",
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
          if (cancelTimeoutRef.current) {
            clearTimeout(cancelTimeoutRef.current);
          }
          try {
            await sendPatientCancel({
              patientId: user?.id ?? "",
              reason: "Cancelled by patient",
            });

            cancelTimeoutRef.current = setTimeout(() => {
              setIsCancelling(false);
              cancelTimeoutRef.current = null;
            }, 8000);
          } catch (error) {
            setIsCancelling(false);
            if (cancelTimeoutRef.current) {
              clearTimeout(cancelTimeoutRef.current);
              cancelTimeoutRef.current = null;
            }
            Alert.alert(
              "Cancel Failed",
              error instanceof Error ? error.message : "Please try again."
            );
          }
        },
      },
    ]);
  };

  useEffect(() => {
    if (status === "COMPLETED" || status === "CANCELLED") {
      setChatOpen(false);
      setUploadSessionId(null);
      void clearPatientSession();
    }
  }, [clearPatientSession, status]);

  const handleChatSend = async (params: {
    content?: string;
    files: { uri: string; name?: string; type?: string }[];
    durationMs?: number;
  }) => {
    setChatSending(true);
    try {
      let sessionId = uploadSessionId;
      if (!booking?.bookingId && !sessionId) {
        const created = await startPatientUploadSession();
        sessionId = created.uploadSessionId;
        setUploadSessionId(sessionId);
      }

      await submitPatientMediaNote({
        bookingId: booking?.bookingId ?? undefined,
        sessionId: sessionId ?? undefined,
        content: params.content,
        files: params.files,
        durationMs: params.durationMs,
      });
    } finally {
      setChatSending(false);
    }
  };

  if (locationState?.loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#ef4444" />
        <Text className="mt-4 text-muted-foreground">Getting your location...</Text>
      </View>
    );
  }

  if (locationState?.error || !locationState?.location) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-red-500 font-semibold">Location Unavailable</Text>
        <Text className="mt-2 text-center text-muted-foreground">{locationState.error}</Text>
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
        onOpenUploads={() => setChatOpen(true)}
      />
      <PatientChatModal
        visible={isChatOpen}
        onClose={() => setChatOpen(false)}
        notes={booking?.notes ?? []}
        sending={isChatSending}
        onSend={handleChatSend}
      />
    </UserMap>
  );
}
