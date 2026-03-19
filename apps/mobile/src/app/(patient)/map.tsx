import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Text,
  Alert,
  View,
  ActivityIndicator,
  Linking,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
import {
  clearActivePatientBookingId,
  loadActivePatientBookingId,
  saveActivePatientBookingId,
} from "@/common/utils/patientBookingStorage";

const PATIENT_BOOKING_TIMEOUT_MS = 40000;

export default function Map() {

  // Sos button functionality
  const callEmergency = () => {
    const phoneNumber = "tel:119";

    Linking.canOpenURL(phoneNumber)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(phoneNumber);
        } else {
          Alert.alert("Error", "Phone call is not supported on this device");
        }
      })
      .catch((err) => console.log(err));
  };
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
  const [cachedBookingId, setCachedBookingId] = useState<string | null>(null);
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
  const previousStatusRef = useRef<BookingStatus | null>(null);

  const isRecoverableGuestSessionError = (error: unknown) => {
    if (!(error instanceof Error)) return false;
    const message = error.message.toLowerCase();
    return (
      message.includes("patient not found") ||
      message.includes("request failed (401)") ||
      message.includes("request failed (403)") ||
      message.includes("invalid token")
    );
  };

  const bootstrapGuestBooking = async (patientSettings: PatientSettingsData) => {
    const location = locationState?.location;
    if (!location) return false;

    const started = await startGuestBooking({
      x: location.x,
      y: location.y,
      patientSettings,
    });
    await signInPatientGuest({
      patient: started.patient,
      accessToken: started.accessToken,
      expiresInSeconds: started.expiresInSeconds,
    });
    return true;
  };

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
    const patientId = user?.role === "patient" ? user.id : null;
    if (!patientId) {
      setCachedBookingId(null);
      return;
    }

    let active = true;
    void loadActivePatientBookingId(patientId).then((bookingId) => {
      if (!active) return;
      setCachedBookingId(bookingId);
    });

    return () => {
      active = false;
    };
  }, [user?.id, user?.role]);

  useEffect(() => {
    const patientId = user?.role === "patient" ? user.id : null;
    if (!patientId) return;

    if (status === "COMPLETED" || status === "CANCELLED") {
      void clearActivePatientBookingId(patientId);
      setCachedBookingId(null);
      return;
    }

    const activeBookingId = booking?.bookingId ?? null;
    if (!activeBookingId) return;

    setCachedBookingId(activeBookingId);
    void saveActivePatientBookingId(patientId, activeBookingId);
  }, [booking?.bookingId, status, user?.id, user?.role]);

  useEffect(() => {
    if (!socket || !cachedBookingId) return;
    const patientId = user?.role === "patient" ? user.id : null;
    if (!patientId) return;

    const requestSync = () => {
      socket.emit("booking:sync:request");
    };

    if (socket.connected) {
      requestSync();
    }
    socket.on("connect", requestSync);

    return () => {
      socket.off("connect", requestSync);
    };
  }, [cachedBookingId, socket, user?.id, user?.role]);

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

    const armBookingTimeout = () => {
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
      }
      bookingTimeoutRef.current = setTimeout(() => {
        setIsBooking(false);
        Alert.alert(
          "Request Taking Longer",
          "No ambulance is available right now. Please try again shortly."
        );
      }, PATIENT_BOOKING_TIMEOUT_MS);
    };

    setIsBooking(true);
    armBookingTimeout();
    const needsGuestBootstrap = !session?.accessToken || !user?.id || user.id === "demo";
    if (needsGuestBootstrap) {
      try {
        await bootstrapGuestBooking(patientSettings);
      } catch (error) {
        setIsBooking(false);
        if (bookingTimeoutRef.current) {
          clearTimeout(bookingTimeoutRef.current);
          bookingTimeoutRef.current = null;
        }
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
    try {
      await sendPatientHelp({
        x: locationState.location.x,
        y: locationState.location.y,
        patientSettings,
      });
    } catch (error) {
      if (isRecoverableGuestSessionError(error)) {
        try {
          await clearPatientSession();
          await bootstrapGuestBooking(patientSettings);
          return;
        } catch {
          // Fall through to default error state and alert below.
        }
      }
      setIsBooking(false);
      if (bookingTimeoutRef.current) {
        clearTimeout(bookingTimeoutRef.current);
        bookingTimeoutRef.current = null;
      }
      Alert.alert("Request Failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  const handleCancelSearch = () => {
    Alert.alert(
      "Cancel Search",
      "Stop looking for an ambulance?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Stop",
          style: "destructive",
          onPress: async () => {
            // Clear the booking timeout so the "taking too long" alert doesn't fire
            if (bookingTimeoutRef.current) {
              clearTimeout(bookingTimeoutRef.current);
              bookingTimeoutRef.current = null;
            }
            // Immediately reset the searching state
            setIsBooking(false);
            try {
              await sendPatientCancel({
                reason: "Cancelled search by patient",
              });
            } catch (error) {
              setIsBooking(true);
              if (bookingTimeoutRef.current) {
                clearTimeout(bookingTimeoutRef.current);
              }
              bookingTimeoutRef.current = setTimeout(() => {
                setIsBooking(false);
                Alert.alert(
                  "Request Taking Longer",
                  "No ambulance is available right now. Please try again shortly."
                );
              }, PATIENT_BOOKING_TIMEOUT_MS);
              Alert.alert(
                "Cancel Failed",
                error instanceof Error ? error.message : "Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    Alert.alert("Cancel Booking", "Are you sure?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          setIsCancelling(true);
          setIsBooking(false);
          if (bookingTimeoutRef.current) {
            clearTimeout(bookingTimeoutRef.current);
            bookingTimeoutRef.current = null;
          }
          if (cancelTimeoutRef.current) {
            clearTimeout(cancelTimeoutRef.current);
          }
          try {
            await sendPatientCancel({
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
    const previousStatus = previousStatusRef.current;
    const isTerminal = status === "COMPLETED" || status === "CANCELLED";
    const movedToTerminalFromActive =
      previousStatus !== null && previousStatus !== "COMPLETED" && previousStatus !== "CANCELLED";

    if (isTerminal && movedToTerminalFromActive) {
      setChatOpen(false);
      setUploadSessionId(null);
      void clearPatientSession();
    }

    previousStatusRef.current = status;
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
        <ActivityIndicator size="large" color="#111827" />
        <Text className="mt-4 text-muted-foreground">Getting your location...</Text>
      </View>
    );
  }

  if (locationState?.error || !locationState?.location) {
    return (
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-danger font-semibold">Location Unavailable</Text>
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
      {/* SOS button */}
      <TouchableOpacity
        style={styles.sosContainer}
        onPress={callEmergency}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={["#ef4444", "#b91c1c"]}
          style={styles.sosButton}
        >
          <Text style={styles.sosText}>SOS</Text>
        </LinearGradient>
      </TouchableOpacity>

      <MapOptions
        bookingAssigned={status !== "COMPLETED"}
        status={status}
        booking={booking}
        onHelpRequest={handleHelpRequest}
        cancelRequest={handleCancel}
        onCancelSearch={handleCancelSearch}
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

// Styles
const styles = StyleSheet.create({
  sosContainer: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 999,
  },
  sosButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  sosText: {
    color: "white",
    fontWeight: "900",
    fontSize: 18,
    letterSpacing: 1,
  },
});
