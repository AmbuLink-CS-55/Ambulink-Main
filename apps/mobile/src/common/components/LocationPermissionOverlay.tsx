import React, { useEffect, useState } from "react";
import { View, Text, Pressable, AppState, AppStateStatus, Linking } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

/**
 * LocationPermissionOverlay Component
 * This is a highly critical full-screen interceptor that prevents the user from using
 * the app if they have declined GPS permissions or turned off their phone's location services.
 * It is rendered constantly at the Root Layout level (`_layout.tsx`) but remains invisible 
 * unless location access is lost.
 */
export function LocationPermissionOverlay() {
  // State: Tracks whether the user granted the app permission to access location.
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  
  // State: Tracks whether the phone's GLOBAL GPS sensor is actually turned on.
  // (A user can grant the app permission, but still have their global GPS turned off).
  const [hasServicesEnabled, setHasServicesEnabled] = useState<boolean>(true);

  /**
   * Core verification function.
   * Asynchronously queries the iOS/Android operating system for the current GPS status.
   */
  const checkLocationStatus = async () => {
    try {
      // 1. HARDWARE CHECK: Verify if the phone's GPS antenna/services are physically enabled.
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      setHasServicesEnabled(servicesEnabled);

      // 2. SOFTWARE CHECK: Verify if the OS gave this specific app permission to read the GPS.
      const { status } = await Location.getForegroundPermissionsAsync();
      
      // "undetermined" means this is the exact first time opening the app.
      // We need to actively prompt the user with the OS-level permission dialog box.
      if (status === "undetermined") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        setHasPermission(newStatus === "granted");
      } else {
        // If it's already "granted" or "denied", just update the state.
        setHasPermission(status === "granted");
      }
    } catch (e) {
      console.error("Error checking location status:", e);
    }
  };

  /**
   * Component Lifecycle & Event Listeners
   * We need to constantly monitor the GPS status, because a user could minimize the app,
   * go to their Settings, turn off GPS, and return to the app. 
   */
  useEffect(() => {
    // Check immediately when the component first mounts.
    checkLocationStatus();

    // Event Listener: AppState monitors if the app is put in the background or brought back to the foreground.
    // If the user returns to the app from their settings menu, we instantly re-verify the GPS status.
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      // "active" means the app is currently on the screen.
      if (nextAppState === "active") {
        checkLocationStatus();
      }
    });

    // Fallback Polling Mechanism:
    // If a user drags down the Android/iOS quick settings menu and taps the GPS toggle
    // *while the app is actively running*, AppState does not change.
    // We poll every 5 seconds to catch edge-case hardware toggles.
    const pollInterval = setInterval(() => {
      checkLocationStatus();
    }, 5000);

    // Cleanup function: Prevents memory leaks by destroying the listeners when/if the component unmounts.
    return () => {
      subscription.remove();
      clearInterval(pollInterval);
    };
  }, []);

  /**
   * Helper function to forcefully open the device's main Settings app 
   * so the user can manually re-enable permissions if they previously clicked "Deny Forever".
   */
  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  // --- RENDERING LOGIC ---

  // If the GPS hardware is ON *and* the App has permission, DO NOT render the overlay.
  // Returning null makes the component completely invisible and takes up 0 processing power.
  if (hasPermission && hasServicesEnabled) {
    return null;
  }

  // If either condition fails, render the full-screen blocking overlay.
  return (
    <View 
      className="absolute inset-0 justify-center items-center p-6"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // Dark translucent backdrop
        zIndex: 9999, // Extremely high z-index forces it to sit above everything else in the app
        elevation: 9999
      }}
    >
      <View 
        className="bg-white rounded-3xl p-8 items-center w-full"
        style={{
          maxWidth: 400,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
          elevation: 10 // Shadowing for depth on Android
        }}
      >
        {/* Warning Icon Container */}
        <View className="w-20 h-20 rounded-full bg-red-100 justify-center items-center mb-6">
          <Ionicons name="location" size={40} color="#EF4444" />
        </View>

        {/* Dynamic Title: Changes based on exactly what went wrong */}
        <Text className="text-2xl font-black text-gray-800 mb-3 text-center">
          {!hasServicesEnabled ? "Location is Off" : "Location Permission"}
        </Text>

        {/* Dynamic Warning Message */}
        <Text 
          className="text-base text-gray-600 text-center mb-8"
          style={{ lineHeight: 24 }}
        >
          {!hasServicesEnabled 
            ? "Your device's location services are turned off. AmbuLink requires your location to find nearby ambulances and provide critical emergency routing."
            : "AmbuLink requires access to your location to accurately dispatch emergency services and track ambulance routes. Please enable location sharing in your settings."
          }
        </Text>

        {/* Action Button: Redirects immediately to OS Settings */}
        <Pressable
          onPress={handleOpenSettings}
          className="w-full h-14 rounded-2xl justify-center items-center active:opacity-80"
          style={{
            backgroundColor: '#1e5bb5',
            shadowColor: '#1e5bb5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4
          }}
        >
          <Text className="text-white text-lg font-bold">
            Open Settings
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
