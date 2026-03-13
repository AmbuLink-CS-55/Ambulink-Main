import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@/global.css";

import { AnimatedSplashScreen } from "@/common/components/AnimatedSplashScreen";
import { LocationPermissionOverlay } from "@/common/components/LocationPermissionOverlay";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
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
