import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "@/hooks/AuthContext";
import { SocketProvider } from "@/hooks/SocketContext";
import { useDriverTracking } from "@/hooks/useDriverTracking";
import Ionicons from "@expo/vector-icons/build/Ionicons";

export default function TabLayout() {
  const { user } = useAuthStore();
  useDriverTracking(true)
  if (!user) return <Redirect href="/(public)/login" />;
  if (user.role !== "driver") return <Redirect href="/login" />;

  return (
    <SocketProvider type="DRIVER">
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="car" size={size} color={color} />
          ),
        }} />
        <Tabs.Screen name="log" options={{
          title: "Log",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums-outline" size={size} color={color} />
          ),
        }} />

        {/*<Tabs.Screen name="settings" options={{ title: "Settings" }} />*/}
      </Tabs>
    </SocketProvider>
  );
}
