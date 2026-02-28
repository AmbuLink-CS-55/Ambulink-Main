import { Tabs, Redirect } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "@/common/hooks/AuthContext";
import { SocketProvider } from "@/common/hooks/SocketContext";
import { useDriverTracking } from "./hooks/useDriverTracking";
import { useDriverHistory } from "./hooks/useDriverHistory";
import { useDriverShift } from "./hooks/useDriverShift";
import Ionicons from "@expo/vector-icons/build/Ionicons";
import { apiGet } from "@/common/lib/api";
import { env } from "../../../env";

function DriverHistoryListener() {
  useDriverHistory();
  return null;
}

export default function TabLayout() {
  const { user } = useAuthStore();
  const isOnShift = useDriverShift((state) => state.isOnShift);
  const setOnShift = useDriverShift((state) => state.setOnShift);
  useDriverTracking(isOnShift);

  useEffect(() => {
    if (!user || user.role !== "driver") return;
    let isMounted = true;

    const hydrateShiftState = async () => {
      try {
        const driver = await apiGet<{ status?: "AVAILABLE" | "BUSY" | "OFFLINE" | null }>(
          `/api/drivers/${env.EXPO_PUBLIC_DRIVER_ID}`
        );
        if (!isMounted) return;
        setOnShift(driver.status === "AVAILABLE" || driver.status === "BUSY");
      } catch (error) {
        console.warn("[driver] shift rehydrate failed", error);
      }
    };

    hydrateShiftState();

    return () => {
      isMounted = false;
    };
  }, [setOnShift, user]);

  if (!user) return <Redirect href="/(public)/login" />;
  if (user.role !== "driver") return <Redirect href="/login" />;

  return (
    <SocketProvider type="DRIVER" enabled={isOnShift}>
      <DriverHistoryListener />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons name="car" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="logs"
          options={{
            title: "Log",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="albums-outline" size={size} color={color} />
            ),
          }}
        />

        {/*<Tabs.Screen name="settings" options={{ title: "Settings" }} />*/}
      </Tabs>
    </SocketProvider>
  );
}
