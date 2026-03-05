import { Redirect, Stack } from "expo-router";
import { SocketProvider } from "@/common/hooks/SocketContext";
import { useAuthStore } from "@/common/hooks/AuthContext";

export default function EmtLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Redirect href="/(public)/login_modern" />;
  if (user.role !== "emt") return <Redirect href="/" />;

  return (
    <SocketProvider type="EMT" enabled>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="patient-info" />
        <Stack.Screen name="notes" />
      </Stack>
    </SocketProvider>
  );
}
