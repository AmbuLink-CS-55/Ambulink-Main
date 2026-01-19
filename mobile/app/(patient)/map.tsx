import UserMap from "@/components/UserMap";
import * as Location from "expo-location";
import { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/src/languages/i18n";
import { useLocation } from "@/src/hooks/useLocation";
import socket from "@/src/socket";

type LatLng = {
  latitude: number;
  longitude: number;
};

export default function Map() {
  const drivers: LatLng[] = [
    { latitude: 6.898356108714619, longitude: 79.85389578706928 },
    { latitude: 6.895353174577009, longitude: 79.85387845284518 },
    { latitude: 6.893795771439718, longitude: 79.85671259848431 },
  ];

  async function sendLocation() {
    // const { location, error, loading } = await useLocation();
    socket.emit("patient-location")
  }

  useEffect(() => {
    socket.on("connect", () => { console.log("ws Connected") })
    socket.on("message", (msg) => { console.log(msg) })
  }, [])

  const { location, error, loading } = useLocation();

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <UserMap
        driverLocations={drivers}
        userLocation={
          location || {
            latitude: 6.898527830579406,
            longitude: 79.85385178316076,
          }
        }
      >
        <TouchableOpacity
          style={[
            styles.callButton,
          ]}
          activeOpacity={0.8}
          onPress={() => socket.emit("help", { location })}
        // disabled={}
        >
          <Text style={styles.buttonText}>
            {/*{booking ? `${i18n.t("map.rideId")}: ${rideId}` : i18n.t("map.callAmbulance")}*/}
          </Text>
          <Text style={styles.statusText}></Text>
        </TouchableOpacity>
      </UserMap>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  callButton: {
    backgroundColor: "#000",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  callButtonActive: {
    backgroundColor: "#FF6B6B",
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  statusText: {
    color: "#FFF",
    fontSize: 12,
    marginTop: 4,
  },
});
