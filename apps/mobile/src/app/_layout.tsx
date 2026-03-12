import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { initLocalNotifications } from "@/common/notifications/service";
import "@/global.css";

export default function RootLayout() {
  useEffect(() => {
    initLocalNotifications().catch((error) => {
      console.warn("[notifications] initialization failed", error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </SafeAreaProvider>
  );
}
