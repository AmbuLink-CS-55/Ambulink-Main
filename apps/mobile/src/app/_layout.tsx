import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@/global.css";

import { LocationPermissionOverlay } from "@/common/components/LocationPermissionOverlay";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <LocationPermissionOverlay />
    </SafeAreaProvider>
  );
}
