import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { initLocalNotifications } from "@/common/notifications/service";
import "@/global.css";

import { AnimatedSplashScreen } from "@/common/components/AnimatedSplashScreen";
import { LocationPermissionOverlay } from "@/common/components/LocationPermissionOverlay";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
    initLocalNotifications().catch((error) => {
      console.warn("[notifications] initialization failed", error);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }} />
      <LocationPermissionOverlay />
      {isSplashVisible && (
        <AnimatedSplashScreen
          onAnimationDone={() => {
            setIsSplashVisible(false);
          }}
        />
      )}
    </SafeAreaProvider>
  );
}
