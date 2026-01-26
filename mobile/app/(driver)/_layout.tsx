import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "../../src/auth/AuthContext";
import { SocketProvider } from "@/src/context/SocketContext";

export default function TabLayout() {
  const { user } = useAuthStore();

  if (!user) return <Redirect href="/(public)/login" />;
  if (user.role !== "driver") return <Redirect href="/login" />;

  return (
    <SocketProvider type="DRIVER">
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="log" options={{ title: "Log" }} />
        {/*<Tabs.Screen name="settings" options={{ title: "Settings" }} />*/}
      </Tabs>
    </SocketProvider>
  );
}
