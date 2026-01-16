import UserMap from "@/components/UserMap";
import * as Location from "expo-location";
import { useEffect, useState, useRef } from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/languages/i18n";

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

  const [booking, setBooking] = useState(false);
  const [location, setLocation] = useState<LatLng | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [rideId, setRideId] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const locationSubscriptionRef = useRef<any>(null);

  async function bookAmbulance() {
    if (booking) return;

    setBooking(true);
    console.log("booking")

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Location permission denied");
        setBooking(false);
        return;
      }

      const initialLocation = await Location.getCurrentPositionAsync({});
      const coords = initialLocation.coords;
      setLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      connectWebSocket(coords.latitude, coords.longitude);

      locationSubscriptionRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 6000,
          distanceInterval: 10,
        },
        (newLocation) => {
          const newCoords = newLocation.coords;
          setLocation({
            latitude: newCoords.latitude,
            longitude: newCoords.longitude,
          });
          sendLocationUpdate(newCoords.latitude, newCoords.longitude);
        }
      );

    } catch (error) {
      console.error("Error booking ambulance:", error);
      setBooking(false);
    }
  }

  function connectWebSocket(lat: number, lng: number) {
    const wsUrl = `ws://192.168.1.4:3000/ride/ws?lat=${lat}&lng=${lng}`;

    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connected");
      wsRef.current = ws;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Message from server:", data);
        setRideId(data.rideId);
        setStatus(data.status);
      } catch (error) {
        console.error("Parse error:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      console.log("WebSocket disconnected");
    };
  }

  function sendLocationUpdate(lat: number, lng: number) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: "LOCATION_UPDATE",
          lat,
          lng,
          timestamp: Date.now(),
        })
      );
    }
  }

  function cancelAmbulance() {
    console.log("Cancelling")
    if (locationSubscriptionRef.current) {
      locationSubscriptionRef.current.remove();
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.close();
    }
    setBooking(false);
    setRideId(null);
    setStatus(null);
    setLocation(null);
  }

  useEffect(() => {
    return () => {
      cancelAmbulance();
    };
  }, []);

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
            booking && styles.callButtonActive,
          ]}
          activeOpacity={0.8}
          onPress={booking ? cancelAmbulance : bookAmbulance}
          disabled={booking}
        >
          <Text style={styles.buttonText}>
            {booking ? `${i18n.t("map.rideId")}: ${rideId}` : i18n.t("map.callAmbulance")}
          </Text>
          <Text style={styles.statusText}>{status}</Text>
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
