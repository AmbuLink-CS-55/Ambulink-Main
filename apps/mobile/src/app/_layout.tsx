import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "@/global.css";

import { LocationPermissionOverlay } from "@/common/components/LocationPermissionOverlay";
import { AnimatedSplashScreen } from "@/common/components/AnimatedSplashScreen";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);

  useEffect(() => {
    // Hide the NATIVE splash screen immediately so our animated one can show up
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
