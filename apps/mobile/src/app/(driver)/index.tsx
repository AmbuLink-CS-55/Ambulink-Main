import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Linking, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useSocket } from "@/common/hooks/SocketContext";
import type {
  BookingAssignedPayload,
  BookingCancelledPayload,
  BookingEtaUpdatedPayload,
  BookingReroutedPayload,
} from "@ambulink/types";
import { env } from "../../../env";
import { postDriverArrived, postDriverCompleted, postDriverShift } from "@/common/lib/driverEvents";
import { useDriverShift } from "@/features/driver/hooks/useDriverShift";
import { RideActions } from "@/features/driver/components/RideActions";
import { RideDetailsCard } from "@/features/driver/components/RideDetailsCard";
import { RideMapCard } from "@/features/driver/components/RideMapCard";
import { ShiftCard } from "@/features/driver/components/ShiftCard";
import { isValidPoint, type Ride } from "@/features/driver/components/types";
import { notifyFromSocket } from "@/common/notifications/service";

const SRI_LANKA_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 2.0,
  longitudeDelta: 2.0,
};

export default function Home() {
  const insets = useSafeAreaInsets();
  const socket = useSocket();
  const isOnShift = useDriverShift((state) => state.isOnShift);
  const setOnShift = useDriverShift((state) => state.setOnShift);
  const [isShiftUpdating, setIsShiftUpdating] = useState(false);
  const [isArrivedUpdating, setIsArrivedUpdating] = useState(false);
  const [isCompletedUpdating, setIsCompletedUpdating] = useState(false);
  const [currentRide, setCurrentRide] = useState<Ride | null>(null);
  const [rideStatus, setRideStatus] = useState<
    "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED"
  >("COMPLETED");

  const pickupPoint = useMemo(
    () => currentRide?.pickupLocation ?? currentRide?.patient.location ?? null,
    [currentRide]
  );

  const mapRegion = useMemo(() => {
    if (isValidPoint(pickupPoint)) {
      const point = pickupPoint!;
      return {
        latitude: point.y,
        longitude: point.x,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }

    return SRI_LANKA_REGION;
  }, [pickupPoint]);

  useEffect(() => {
    if (!socket || !isOnShift) return;

    const onConnect = () => {
      console.info("[driver] WebSocket connected");
    };

    const onAssigned = (data: BookingAssignedPayload) => {
      setCurrentRide(data as Ride);
      setRideStatus(data.status ?? "ASSIGNED");
      if (data.bookingId) {
        notifyFromSocket("DRIVER", {
          type: "ASSIGNED",
          bookingId: data.bookingId,
        }).catch((error) => console.warn("[notifications] driver ASSIGNED failed", error));
      }
    };

    const onCancelled = (payload: BookingCancelledPayload) => {
      if (payload?.bookingId) {
        notifyFromSocket("DRIVER", {
          type: "CANCELLED",
          bookingId: payload.bookingId,
          reason: payload.reason,
        }).catch((error) => console.warn("[notifications] driver CANCELLED failed", error));
      }
      setCurrentRide(null);
      setRideStatus("CANCELLED");
    };

    const onEtaUpdated = (payload: BookingEtaUpdatedPayload) => {
      if (!payload.bookingId) return;
      notifyFromSocket("DRIVER", {
        type: "ETA_UPDATED",
        bookingId: payload.bookingId,
        etaMinutes: payload.etaMinutes,
        previousEtaMinutes: payload.previousEtaMinutes,
      }).catch((error) => console.warn("[notifications] driver ETA_UPDATED failed", error));
    };

    const onRerouted = (payload: BookingReroutedPayload) => {
      if (!payload.bookingId) return;
      notifyFromSocket("DRIVER", {
        type: "REROUTED",
        bookingId: payload.bookingId,
        reason: payload.reason,
      }).catch((error) => console.warn("[notifications] driver REROUTED failed", error));
    };

    socket.on("connect", onConnect);
    socket.on("booking:assigned", onAssigned);
    socket.on("booking:cancelled", onCancelled);
    socket.on("booking:eta-updated", onEtaUpdated);
    socket.on("booking:rerouted", onRerouted);

    return () => {
      socket.off("connect", onConnect);
      socket.off("booking:assigned", onAssigned);
      socket.off("booking:cancelled", onCancelled);
      socket.off("booking:eta-updated", onEtaUpdated);
      socket.off("booking:rerouted", onRerouted);
    };
  }, [isOnShift, socket]);

  const handleToggleShift = useCallback(async () => {
    if (isOnShift && currentRide) {
      Alert.alert("Active Booking", "Complete or cancel the active booking before clocking out.");
      return;
    }

    const nextOnShift = !isOnShift;
    setIsShiftUpdating(true);
    try {
      await postDriverShift({
        driverId: env.EXPO_PUBLIC_DRIVER_ID,
        onShift: nextOnShift,
      });
      setOnShift(nextOnShift);

      if (!nextOnShift) {
        setCurrentRide(null);
        setRideStatus("COMPLETED");
      }
    } catch (error) {
      Alert.alert(
        "Shift Update Failed",
        error instanceof Error ? error.message : "Please try again."
      );
    } finally {
      setIsShiftUpdating(false);
    }
  }, [currentRide, isOnShift, setOnShift]);

  const handleArrived = useCallback(async () => {
    if (!currentRide || isArrivedUpdating) return;
    setIsArrivedUpdating(true);
    try {
      await postDriverArrived({ driverId: env.EXPO_PUBLIC_DRIVER_ID });
      setRideStatus("ARRIVED");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update ride status");
    } finally {
      setIsArrivedUpdating(false);
    }
  }, [currentRide, isArrivedUpdating]);

  const handleCompleted = useCallback(async () => {
    if (!currentRide || isCompletedUpdating) return;
    setIsCompletedUpdating(true);
    try {
      await postDriverCompleted({ driverId: env.EXPO_PUBLIC_DRIVER_ID });
      setCurrentRide(null);
      setRideStatus("COMPLETED");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to complete ride");
    } finally {
      setIsCompletedUpdating(false);
    }
  }, [currentRide, isCompletedUpdating]);

  const handleCall = useCallback((phone?: string) => {
    if (!phone) {
      Alert.alert("Error", "No phone number");
      return;
    }
    Linking.openURL(`tel:${phone}`);
  }, []);

  const handleOpenOnMap = useCallback(() => {
    if (!currentRide || !isValidPoint(pickupPoint)) {
      Alert.alert("Location Unavailable", "Patient location is not available yet.");
      return;
    }
    const targetPickup = pickupPoint!;

    if (rideStatus === "ASSIGNED") {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${targetPickup.y},${targetPickup.x}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open Google Maps"));
      return;
    }

    if (rideStatus === "ARRIVED") {
      if (!isValidPoint(currentRide.hospital.location)) {
        Alert.alert("Location Unavailable", "Hospital location is not available.");
        return;
      }

      const hospitalLocation = currentRide.hospital.location;
      if (!hospitalLocation) return;
      const url = `https://www.google.com/maps/dir/?api=1&origin=${targetPickup.y},${targetPickup.x}&destination=${hospitalLocation.y},${hospitalLocation.x}`;
      Linking.openURL(url).catch(() => Alert.alert("Error", "Could not open Google Maps"));
    }
  }, [currentRide, pickupPoint, rideStatus]);

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-background">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 88, 96) }}
      >
        <View className="p-4">
          <Text className="text-2xl font-bold text-foreground mb-4">Current Activity</Text>

          <ShiftCard
            isOnShift={isOnShift}
            isShiftUpdating={isShiftUpdating}
            onToggleShift={handleToggleShift}
          />

          <RideMapCard
            currentRide={currentRide}
            pickupPoint={pickupPoint}
            mapRegion={mapRegion}
            isOnShift={isOnShift}
            onOpenOnMap={handleOpenOnMap}
          />

          <RideDetailsCard currentRide={currentRide} rideStatus={rideStatus} />

          <RideActions
            isOnShift={isOnShift}
            currentRide={currentRide}
            rideStatus={rideStatus}
            isArrivedUpdating={isArrivedUpdating}
            isCompletedUpdating={isCompletedUpdating}
            onCall={handleCall}
            onArrived={handleArrived}
            onCompleted={handleCompleted}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
