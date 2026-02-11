import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSocket } from "@/hooks/SocketContext";
import { useLocation } from "@/hooks/useLocation";
import type { Point, Booking, BookingStatus, User, Hospital } from "@ambulink/types";


const SRI_LANKA_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 2.0,
  longitudeDelta: 2.0,
};

export default function Home() {
  const socket = useSocket()
  const [currentRide, setCurrentRide] = useState<{patient: User, pickedDriver: User, hospital: Hospital} | null>(null);
  const [rideStatus, setRideStatus] = useState<BookingStatus>("COMPLETED");

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => { console.log("ws Connected") })
    socket.on("booking:assigned", (data: {patient: User, pickedDriver: User, hospital: Hospital}) => {
      console.log("booking:assigned:driver", data);
      setCurrentRide(data);
      setRideStatus("ASSIGNED");
    });
    socket.on("booking:cancelled", () => {
      setCurrentRide(null)
      setRideStatus("CANCELLED")
    })

    // return () => {
    //   socket?.disconnect();
    // };
  }, [socket])

  const handleArrived = async () => {
    if (!socket || !currentRide) return;
    socket.emit("driver:arrived");
    setRideStatus("ARRIVED");
  };

  const handleCompleted = async () => {
    if (!socket || !currentRide) return;
    socket.emit("driver:completed");
    setCurrentRide(null)
    setRideStatus("COMPLETED");
  };

  const handleCall = (phone?: string) => {
    if (!phone) return Alert.alert("Error", "No phone number");
    Linking.openURL(`tel:${phone}`);
  };

    const handleOpenOnMap = () => {
      if (!currentRide) return;

      let url = "";

      if (rideStatus === "ASSIGNED") {
        url = `https://www.google.com/maps/dir/?api=1&destination=${currentRide.patient.currentLocation!.x},${currentRide.patient.currentLocation!.y}`;
      } else if (rideStatus === "ARRIVED") {
        url = `https://www.google.com/maps/dir/?api=1&origin=${currentRide.patient.currentLocation!.x},${currentRide.patient.currentLocation!.y}&destination=${currentRide.hospital.location!.x},${currentRide.hospital.location!.y}`;
      }

      if (url) {
        Linking.openURL(url).catch((err) =>
          Alert.alert("Error", "Could not open Google Maps")
        );
      }
    };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        contentContainerStyle={{}}
        showsVerticalScrollIndicator={false}
      >
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-800 mb-4">Current Activity</Text>

          <View className="rounded-2xl overflow-hidden shadow-sm bg-white border border-gray-100">
            <View style={{ height: 220, width: '100%' }}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={{ flex: 1 }}
                showsPointsOfInterest={false}
                initialRegion={currentRide ? {
                  latitude: currentRide.patient.currentLocation!.x,
                  longitude: currentRide.patient.currentLocation!.y,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                } : SRI_LANKA_REGION}
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

                    <Marker
                      coordinate={{ latitude: currentRide.patient.currentLocation!.x, longitude: currentRide.patient.currentLocation!.y}}
                      title="Patient"
                      pinColor="red"
                    />
                    <Marker
                      coordinate={{ latitude: currentRide.hospital.location!.x, longitude: currentRide.hospital.location!.y}}
                      title="Hospital"
                      pinColor="blue"
                    />
                  </>
                )}
              </MapView>
            </View>

            <TouchableOpacity
              activeOpacity={0.8}
              className={`p-4 items-center justify-center ${currentRide ? 'bg-green-500' : 'bg-gray-300'}`}
              onPress={handleOpenOnMap}
              disabled={!currentRide}
            >
              <Text className="text-white font-bold text-lg">Open in Navigation</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Text className="text-xs font-bold text-gray-400 uppercase mb-3">Ride Details</Text>
            <DetailItem label="Patient Name" value={currentRide?.patient.fullName?? "None"} />
            <DetailItem label="Hospital" value={currentRide?.hospital.name ?? "None"} />
            <DetailItem label="Status" value={rideStatus} />
          </View>

          <View className="mt-3">
            <TouchableOpacity
              onPress={() => handleCall(currentRide?.patient.phoneNumber)}
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
