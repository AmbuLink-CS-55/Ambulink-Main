import UserMap from "../(patient)/_components/UserMap";
import { useSocket } from "@/common/hooks/SocketContext";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocation } from "@/common/hooks/useLocation";
import type { Point } from "@ambulink/types";
import { AppImage as Image } from "@/common/components/AppImage";

const LocationCard = ({
  title,
  subtitle,
  onPress,
}: {
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) => (
  <Pressable
    className="flex-row items-center bg-gray-100 rounded-2xl p-4 w-full shadow-md"
    onPress={onPress}
  >
    <View className="w-10 h-10 rounded-full bg-red-300 justify-center items-center mr-4">
      <MaterialCommunityIcons name="heart-pulse" size={24} color="#000" />
    </View>
    <View className="flex-1 justify-center">
      <Text className="text-base font-bold text-gray-800">{title}</Text>
      {subtitle && <Text className="text-xs text-gray-600 mt-0.5">{subtitle}</Text>}
    </View>
    <Image
      source={{ uri: "https://via.placeholder.com/50" }}
      className="w-10 h-10"
      contentFit="contain"
    />
  </Pressable>
);

const Separator = () => (
  <View className="h-5 justify-center items-center gap-0.5">
    <View className="w-5 h-1 bg-gray-300 rounded-sm" />
    <View className="w-5 h-1 bg-gray-300 rounded-sm" />
    <View className="w-5 h-1 bg-gray-300 rounded-sm" />
  </View>
);

export default function Navigation() {
  const socket = useSocket();
  const { location } = useLocation();

  const drivers: Point[] = [
    { x: 79.85389578706928, y: 6.898356108714619 },
    { x: 79.85387845284518, y: 6.895353174577009 },
    { x: 79.85671259848431, y: 6.893795771439718 },
  ];

  useEffect(() => {
    if (!socket) return;
    socket.on("connect", () => {
      console.info("[emt] WebSocket connected");
    });
    socket.on("message", (msg: string) => {
      console.log("[emt] Message received:", msg);
    });

    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <UserMap
        driverLocations={drivers}
        userLocation={
          location ?? {
            x: 79.85385178316076,
            y: 6.898527830579406,
          }
        }
      />
      <View className="absolute top-16 left-4 right-4 items-center">
        <LocationCard
          title="Hospital"
          onPress={() => console.info("[emt] Hospital card pressed")}
        />
        <Separator />
        <LocationCard
          title="Address, Address, No 123"
          subtitle="10Km away"
          onPress={() => console.info("[emt] Address card pressed")}
        />
      </View>
    </SafeAreaView>
  );
}
