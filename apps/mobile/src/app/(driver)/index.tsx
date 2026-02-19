import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSocket } from "@/hooks/SocketContext";
import type { BookingStatus } from "@ambulink/types";

const SRI_LANKA_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 2.0,
  longitudeDelta: 2.0,
};

export default function Home() {
  const socket = useSocket();
  const [currentRide, setCurrentRide] = useState<{
    bookingId: string | null;
    status: "ASSIGNED" | "ARRIVED" | "PICKEDUP";
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
    if (!socket) return;
    socket.on("connect", () => {
      console.info("[driver] WebSocket connected");
    });
    socket.on("booking:assigned", (data) => {
      console.info("[driver] Booking assigned:", {
        patientId: data.patient?.id,
        hospital: data.hospital?.id,
      });
      setCurrentRide(data);
      setRideStatus(data.status ?? "ASSIGNED");
    });
    socket.on("booking:cancelled", () => {
      setCurrentRide(null);
      setRideStatus("CANCELLED");
    });

    return () => {
      socket?.disconnect();
    };
  }, [socket]);

  const handleArrived = async () => {
    if (!socket || !currentRide) return;
    socket.emit("driver:arrived");
    setRideStatus("ARRIVED");
  };

  const handleCompleted = async () => {
    if (!socket || !currentRide) return;
    socket.emit("driver:completed");
    setCurrentRide(null);
    setRideStatus("COMPLETED");
  };

  const handleCall = (phone?: string) => {
    if (!phone) return Alert.alert("Error", "No phone number");
    Linking.openURL(`tel:${phone}`);
  };

  const handleOpenOnMap = () => {
    if (!currentRide) return;

    if (!isValidPoint(currentRide.patient.location ?? null)) {
      Alert.alert("Location Unavailable", "Patient location is not available yet.");
      return;
    }

    let url = "";

    if (rideStatus === "ASSIGNED" && currentRide.patient.location) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${currentRide.patient.location.y},${currentRide.patient.location.x}`;
    } else if (rideStatus === "ARRIVED") {
      if (!currentRide.patient.location || !isValidPoint(currentRide.hospital.location ?? null)) {
        Alert.alert("Location Unavailable", "Hospital location is not available.");
        return;
      }
      const hospitalLocation = currentRide.hospital.location;
      if (!hospitalLocation) {
        Alert.alert("Location Unavailable", "Hospital location is not available.");
        return;
      }
      url = `https://www.google.com/maps/dir/?api=1&origin=${currentRide.patient.location.y},${currentRide.patient.location.x}&destination=${hospitalLocation.y},${hospitalLocation.x}`;
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

          <View className="rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100">
            <View style={{ height: 220, width: "100%" }}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                showsPointsOfInterest={false}
                initialRegion={
                  currentRide?.patient.location && isValidPoint(currentRide.patient.location)
                    ? {
                        latitude: currentRide.patient.location.y,
                        longitude: currentRide.patient.location.x,
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                      }
                    : SRI_LANKA_REGION
                }
              >
                {currentRide && (
                  <>
                    {/*when rich
                  <MapViewDirections
                    origin={{ latitude: currentRide.patient.lat, longitude: currentRide.patient.lng }}
                    destination={{ latitude: currentRide.hospital.lat, longitude: currentRide.hospital.lng }}
                    apikey={GOOGLE_MAPS_APIKEY}
                    strokeWidth={4}
                    strokeColor="#4ade80"
                  />*/}

                    {currentRide.patient.location && isValidPoint(currentRide.patient.location) && (
                      <Marker
                        coordinate={{
                          latitude: currentRide.patient.location.y,
                          longitude: currentRide.patient.location.x,
                        }}
                        title="Patient"
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

            <TouchableOpacity
              activeOpacity={0.8}
              className={`p-4 items-center justify-center ${currentRide ? "bg-green-500" : "bg-gray-300"}`}
              onPress={handleOpenOnMap}
              disabled={!currentRide}
            >
              <Text className="text-white font-bold text-lg">Open in Navigation</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Ride Details</Text>
            <DetailItem label="Patient Name" value={currentRide?.patient.fullName ?? "None"} />
            <DetailItem label="Hospital" value={currentRide?.hospital.name ?? "None"} />
            <DetailItem label="Status" value={rideStatus} />
          </View>

          <View className="mt-3">
            <TouchableOpacity
              onPress={() => handleCall(currentRide?.patient.phoneNumber ?? undefined)}
              disabled={!currentRide}
              className={`p-4 mt-3 rounded-xl items-center ${currentRide ? "bg-white" : "bg-gray-200"}`}
            >
              <Text className="text-black font-bold">📞 Call Patient</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleArrived}
              disabled={rideStatus !== "ASSIGNED"}
              className={`p-4 mt-3 rounded-xl items-center ${rideStatus === "ASSIGNED" ? "bg-yellow-400" : "bg-gray-200"}`}
            >
              <Text className="font-bold">Arrived</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCompleted}
              disabled={rideStatus !== "ARRIVED"}
              className={`p-4 mt-3 rounded-xl items-center ${rideStatus === "ARRIVED" ? "bg-green-500" : "bg-gray-200"}`}
            >
              <Text className="text-white font-bold">Complete Ride</Text>
            </TouchableOpacity>
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
