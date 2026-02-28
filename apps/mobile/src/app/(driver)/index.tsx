import { useEffect, useState } from "react";
import { Alert, Linking, Pressable, ScrollView, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSocket } from "@/hooks/SocketContext";
import type { BookingAssignedPayload, BookingStatus } from "@ambulink/types";
import { env } from "../../../env";
import { postDriverArrived, postDriverCompleted, postDriverShift } from "@/lib/driverEvents";
import { useDriverShift } from "@/hooks/useDriverShift";

const SRI_LANKA_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 2.0,
  longitudeDelta: 2.0,
};

export default function Home() {
  const socket = useSocket();
  const isOnShift = useDriverShift((state) => state.isOnShift);
  const setOnShift = useDriverShift((state) => state.setOnShift);
  const [isShiftUpdating, setIsShiftUpdating] = useState(false);
  const [currentRide, setCurrentRide] = useState<{
    bookingId: string | null;
    status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
    pickupLocation: { x: number; y: number } | null;
    patient: {
      id: string;
      fullName: string | null;
      phoneNumber: string | null;
      location: { x: number; y: number } | null;
    };
    driver: {
      id: string;
      fullName: string | null;
      phoneNumber: string | null;
      location: { x: number; y: number } | null;
      provider: { id: string; name: string } | null;
    };
    hospital: {
      id: string;
      name: string | null;
      phoneNumber: string | null;
      location: { x: number; y: number } | null;
    };
    provider: { id: string; name: string } | null;
  } | null>(null);
  const [rideStatus, setRideStatus] = useState<BookingStatus>("COMPLETED");
  const isValidPoint = (point?: { x: number; y: number } | null) =>
    Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));

  useEffect(() => {
    if (!socket || !isOnShift) return;
    const onConnect = () => {
      console.info("[driver] WebSocket connected");
    };
    const onAssigned = (data: BookingAssignedPayload) => {
      console.info("[driver] Booking assigned:", {
        patientId: data.patient?.id,
        hospital: data.hospital?.id,
      });
      setCurrentRide(data);
      setRideStatus(data.status ?? "ASSIGNED");
    };
    const onCancelled = () => {
      setCurrentRide(null);
      setRideStatus("CANCELLED");
    };

    socket.on("connect", onConnect);
    socket.on("booking:assigned", onAssigned);
    socket.on("booking:cancelled", onCancelled);

    return () => {
      socket.off("connect", onConnect);
      socket.off("booking:assigned", onAssigned);
      socket.off("booking:cancelled", onCancelled);
    };
  }, [isOnShift, socket]);

  const handleToggleShift = async () => {
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
      Alert.alert("Shift Update Failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsShiftUpdating(false);
    }
  };

  const handleArrived = async () => {
    if (!currentRide) return;
    try {
      await postDriverArrived({ driverId: env.EXPO_PUBLIC_DRIVER_ID });
      setRideStatus("ARRIVED");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to update ride status");
    }
  };

  const handleCompleted = async () => {
    if (!currentRide) return;
    try {
      await postDriverCompleted({ driverId: env.EXPO_PUBLIC_DRIVER_ID });
      setCurrentRide(null);
      setRideStatus("COMPLETED");
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to complete ride");
    }
  };

  const handleCall = (phone?: string) => {
    if (!phone) return Alert.alert("Error", "No phone number");
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenOnMap = () => {
    if (!currentRide) return;
    const targetPickup = currentRide.pickupLocation ?? currentRide.patient.location;

    if (!isValidPoint(targetPickup ?? null)) {
      Alert.alert("Location Unavailable", "Patient location is not available yet.");
      return;
    }

    let url = "";

    if (rideStatus === "ASSIGNED" && targetPickup) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${targetPickup.y},${targetPickup.x}`;
    } else if (rideStatus === "ARRIVED") {
      if (!targetPickup || !isValidPoint(currentRide.hospital.location ?? null)) {
        Alert.alert("Location Unavailable", "Hospital location is not available.");
        return;
      }
      const hospitalLocation = currentRide.hospital.location;
      if (!hospitalLocation) {
        Alert.alert("Location Unavailable", "Hospital location is not available.");
        return;
      }
      url = `https://www.google.com/maps/dir/?api=1&origin=${targetPickup.y},${targetPickup.x}&destination=${hospitalLocation.y},${hospitalLocation.x}`;
    }
    console.info("[driver] Opening Maps:", url);
    if (url) {
      Linking.openURL(url).catch((err) => Alert.alert("Error", "Could not open Google Maps"));
    }
  };

  return (
    <SafeAreaView edges={["top", "left", "right"]} className="flex-1 bg-gray-50">
      <ScrollView contentContainerStyle={{}} showsVerticalScrollIndicator={false}>
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Current Activity</Text>
          <View className="mb-4 rounded-2xl bg-white p-4 border border-gray-100 shadow-sm">
            <Text className="text-xs font-bold text-gray-400 uppercase">Shift</Text>
            <Text className="mt-1 text-lg font-semibold text-gray-900">
              {isOnShift ? "On Shift" : "Off Shift"}
            </Text>
            <Text className="mt-1 text-xs text-gray-500">
              {isOnShift
                ? "Location sharing is active for dispatch."
                : "Clock in to receive bookings and share location."}
            </Text>
            <Pressable
              className={`mt-3 rounded-xl p-3 items-center ${
                isOnShift ? "bg-red-500" : "bg-emerald-500"
              } ${isShiftUpdating ? "opacity-60" : ""}`}
              onPress={handleToggleShift}
              disabled={isShiftUpdating}
            >
              <Text className="text-white font-bold">
                {isShiftUpdating ? "Updating..." : isOnShift ? "Clock Out" : "Clock In"}
              </Text>
            </Pressable>
          </View>

          <View className="rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100">
            <View style={{ height: 220, width: "100%" }}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                showsPointsOfInterest={false}
                initialRegion={
                  (currentRide?.pickupLocation && isValidPoint(currentRide.pickupLocation)) ||
                  (currentRide?.patient.location && isValidPoint(currentRide.patient.location))
                    ? {
                        latitude: (currentRide.pickupLocation ?? currentRide.patient.location)!.y,
                        longitude: (currentRide.pickupLocation ?? currentRide.patient.location)!.x,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      }
                    : SRI_LANKA_REGION
                }
              >
                {currentRide && (
                  <>
                    {(currentRide.pickupLocation || currentRide.patient.location) &&
                      isValidPoint(currentRide.pickupLocation ?? currentRide.patient.location) && (
                      <Marker
                        coordinate={{
                          latitude: (currentRide.pickupLocation ?? currentRide.patient.location)!.y,
                          longitude: (currentRide.pickupLocation ?? currentRide.patient.location)!.x,
                        }}
                        title="Pickup"
                        pinColor="red"
                      />
                    )}
                    {currentRide.hospital.location &&
                      isValidPoint(currentRide.hospital.location) && (
                        <Marker
                          coordinate={{
                            latitude: currentRide.hospital.location.y,
                            longitude: currentRide.hospital.location.x,
                          }}
                          title="Hospital"
                          pinColor="blue"
                        />
                      )}
                  </>
                )}
              </MapView>
            </View>

            <Pressable
              className={`p-4 items-center justify-center ${currentRide && isOnShift ? "bg-green-500" : "bg-gray-300"}`}
              onPress={handleOpenOnMap}
              disabled={!currentRide || !isOnShift}
            >
              <Text className="text-white font-bold text-lg">Open in Navigation</Text>
            </Pressable>
          </View>

          <View className="mt-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Ride Details</Text>
            <DetailItem label="Patient Name" value={currentRide?.patient.fullName ?? "None"} />
            <DetailItem label="Hospital" value={currentRide?.hospital.name ?? "None"} />
            <DetailItem label="Status" value={rideStatus} />
          </View>

          <View className="mt-3">
            <Pressable
              onPress={() => handleCall(currentRide?.patient.phoneNumber ?? undefined)}
              disabled={!currentRide || !isOnShift}
              className={`p-4 mt-3 rounded-xl items-center ${currentRide && isOnShift ? "bg-white" : "bg-gray-200"}`}
            >
              <Text className="text-black font-bold">📞 Call Patient</Text>
            </Pressable>

            <Pressable
              onPress={handleArrived}
              disabled={rideStatus !== "ASSIGNED"}
              className={`p-4 mt-3 rounded-xl items-center ${rideStatus === "ASSIGNED" ? "bg-yellow-400" : "bg-gray-200"}`}
            >
              <Text className="font-bold">Arrived</Text>
            </Pressable>

            <Pressable
              onPress={handleCompleted}
              disabled={rideStatus !== "ARRIVED"}
              className={`p-4 mt-3 rounded-xl items-center ${rideStatus === "ARRIVED" ? "bg-green-500" : "bg-gray-200"}`}
            >
              <Text className="text-white font-bold">Complete Ride</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <View className="mb-3">
    <Text className="text-gray-500 text-sm">{label}</Text>
    <Text className="text-gray-900 font-semibold text-base">{value}</Text>
  </View>
);
