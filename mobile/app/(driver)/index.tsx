import { SocketClientCreator } from "@/src/socket";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Linking, ScrollView, Text, TouchableOpacity, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { Socket } from "socket.io-client";
import MapViewDirections from 'react-native-maps-directions';
import { useLocation } from "@/src/hooks/useLocation";
import { useDriverTracking } from "@/src/hooks/useDriverTracking";
import { useSocket } from "@/src/context/SocketContext";

type Patient = {
  name: string;
  lat: number;
  lng: number;
  phone?: string;
  // address: string;
}
type Hospital = {
  name: string;
  lat: number;
  lng: number;
}
type CurrentRide = {
  patient: Patient;
  hospital: Hospital;
}
const SRI_LANKA_REGION = {
  latitude: 7.8731,
  longitude: 80.7718,
  latitudeDelta: 2.0,
  longitudeDelta: 2.0,
};

const GOOGLE_MAPS_APIKEY = "API_KEY";

export default function Home() {
  // useDriverTracking(true)
  const socket = useSocket()
  const [currentRide, setCurrentRide] = useState<CurrentRide | null>(null);

  const handleCall = (phoneNumber?: string) => {
    if (!phoneNumber) {
      Alert.alert("Error", "No phone number available for this patient");
      return;
    }
    Linking.openURL(`tel:${phoneNumber}`);
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => { console.log("ws Connected") })
    socket.on("message", (msg: string) => { console.log(msg) })
    socket.on("booking:assigned", (bookingData) => { console.log("booking:assigned:driver", bookingData);  setCurrentRide(bookingData)})

    // return () => {
    //   socket?.disconnect();
    // };
  }, [socket])

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
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
                latitude: currentRide.patient.lat,
                longitude: currentRide.patient.lng,
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
                    coordinate={{ latitude: currentRide.patient.lat, longitude: currentRide.patient.lng }}
                    title="Patient"
                    pinColor="red"
                  />
                  <Marker
                    coordinate={{ latitude: currentRide.hospital.lat, longitude: currentRide.hospital.lng }}
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
            disabled={!currentRide}
          >
            <Text className="text-white font-bold text-lg">Open in Navigation</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-6 p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Ride Details</Text>
          <View>
            <DetailItem label="Patient Name" value={currentRide?.patient.name ?? "Waiting for request..."} />
            <DetailItem label="Hospital" value={currentRide?.hospital.name ?? "None"} />
          </View>
        </View>

        <View className="mt-3">
          <TouchableOpacity
            onPress={() => socket?.emit("driver:arrived", { driverId: "1" })}
            className="p-4 mt-3 bg-white rounded-xl items-center"
          >
            <Text className="text-black font-bold">📞 Call Patient</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => socket?.emit("driver:arrived", { driverId: "1" })}
            className="p-4 mt-3 bg-white rounded-xl items-center"
          >
            <Text className="text-black font-bold">Arrived</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => socket?.emit("driver:completed", { driverId: "1" })}
            className="p-4 mt-3 bg-white rounded-xl items-center"
          >
            <Text className="text-black font-bold">Complete Ride</Text>
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
