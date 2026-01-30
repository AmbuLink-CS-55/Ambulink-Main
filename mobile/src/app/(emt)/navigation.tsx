import UserMap from "@/components/patient/UserMap";
import { useSocket } from "@/hooks/SocketContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocation } from "@/hooks/useLocation";

type LatLng = {
  lat: number;
  lng: number;
};

const LocationCard = ({ title, subtitle, onPress }: { title: string, subtitle?: string, onPress?: () => void }) => (
  <TouchableOpacity style={styles.cardContainer} onPress={onPress}>
    <View style={styles.iconCircle}>
      <MaterialCommunityIcons name="heart-pulse" size={24} color="#000" />
    </View>
    <View style={styles.textContainer}>
      <Text style={styles.cardTitle}>{title}</Text>
      {subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}
    </View>
    <Image
      source={{ uri: 'https://via.placeholder.com/50' }}
      style={styles.logoImage}
    />
  </TouchableOpacity>
);

const Separator = () => (
  <View style={styles.separatorContainer}>
    <View style={styles.separatorLine} />
    <View style={styles.separatorLine} />
    <View style={styles.separatorLine} />
  </View>
);

export default function Navigation() {
  const socket = useSocket();
  const { location } = useLocation();

  const drivers: LatLng[] = [
    { lat: 6.898356108714619, lng: 79.85389578706928 },
    { lat: 6.895353174577009, lng: 79.85387845284518 },
    { lat: 6.893795771439718, lng: 79.85671259848431 },
  ];

  async function sendLocation() {
    if (!socket) return;
    socket.emit("emt-location");
  }

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => { console.log("ws Connected") });
    socket.on("message", (msg: string) => { console.log(msg) });
  }, []);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <UserMap
        driverLocations={drivers}
        userLocation={
          location ? {
            lat: location.latitude,
            lng: location.longitude,
          } : {
            lat: 6.898527830579406,
            lng: 79.85385178316076,
          }
        }
      />
      <View style={styles.topOverlayContainer}>
        <LocationCard
          title="Hospital"
          onPress={() => console.log("Hospital Clicked")}
        />
        <Separator />
        <LocationCard
          title="Address, Address, No 123"
          subtitle="10Km away"
          onPress={() => console.log("Address Clicked")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topOverlayContainer: {
    position: "absolute",
    top: 60,
    left: 15,
    right: 15,
    alignItems: "center",
  },
  cardContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 15,
    padding: 15,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F08080",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  logoImage: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  separatorContainer: {
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 3,
  },
  separatorLine: {
    width: 20,
    height: 3,
    backgroundColor: "#D3D3D3",
    borderRadius: 2,
  },
});
