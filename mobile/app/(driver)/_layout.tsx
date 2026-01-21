import { Tabs, Redirect } from "expo-router";
import { useAuthStore } from "../../src/auth/AuthContext";

export default function TabLayout() {
  const { user } = useAuthStore();

  if (!user) return <Redirect href="/(public)/login" />;
  if (user.role !== "driver") return <Redirect href="/login" />;

  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
