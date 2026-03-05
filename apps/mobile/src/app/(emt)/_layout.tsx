import { Redirect, Stack } from "expo-router";
import { SocketProvider, useSocket } from "@/common/hooks/SocketContext";
import { useEmtSocketEvents } from "@/features/emt/hooks/useEmtSocketEvents";
import { useAuthStore } from "@/common/hooks/AuthContext";

function EmtSocketEventsBridge() {
  const socket = useSocket();
  useEmtSocketEvents(socket);
  return null;
}

export default function EmtLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) return <Redirect href="/(public)/login_modern" />;
  if (user.role !== "emt") return <Redirect href="/" />;

  return (
    <SocketProvider type="EMT" enabled>
      <EmtSocketEventsBridge />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="patient-info" />
        <Stack.Screen name="notes" />
      </Stack>
    </SocketProvider>
  );
}
