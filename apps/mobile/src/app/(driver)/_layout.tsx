import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "@/hooks/AuthContext";
import { SocketProvider } from "@/hooks/SocketContext";
import { useDriverTracking } from "@/hooks/useDriverTracking";
import { useDriverHistory } from "@/hooks/useDriverHistory";
import Ionicons from "@expo/vector-icons/build/Ionicons";

function DriverHistoryListener() {
  useDriverHistory();
  return null;
}

export default function TabLayout() {
  const { user } = useAuthStore();
  useDriverTracking(true);
  if (!user) return <Redirect href="/(public)/login" />;
  if (user.role !== "driver") return <Redirect href="/login" />;

  return (
    <SocketProvider type="DRIVER">
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
