import React, { useEffect, useState } from "react";
import { View, Text, Pressable, AppState, AppStateStatus, Linking } from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";

export function LocationPermissionOverlay() {
  const [hasPermission, setHasPermission] = useState<boolean>(true);
  const [hasServicesEnabled, setHasServicesEnabled] = useState<boolean>(true);

  const checkLocationStatus = async () => {
    try {
      // 1. Check if GPS/Location services are turned on in the phone settings
      const servicesEnabled = await Location.hasServicesEnabledAsync();
      setHasServicesEnabled(servicesEnabled);

      // 2. Check if the app has permission to use location
      const { status } = await Location.getForegroundPermissionsAsync();
      
      // If permission is undetermined, we can ask for it.
      // If it's denied, they have to go to settings.
      if (status === "undetermined") {
        const { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        setHasPermission(newStatus === "granted");
      } else {
        setHasPermission(status === "granted");
      }
    } catch (e) {
      console.error("Error checking location status:", e);
    }
  };

  useEffect(() => {
    checkLocationStatus();

    // Re-check when the app comes back from background (e.g. after they go to settings)
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      if (nextAppState === "active") {
        checkLocationStatus();
      }
    });

    // Also poll every 5 seconds just in case they turn off the location from the quick settings dropdown
    // while the app is actively running.
    const pollInterval = setInterval(() => {
      checkLocationStatus();
    }, 5000);

    return () => {
      subscription.remove();
      clearInterval(pollInterval);
    };
  }, []);

  const handleOpenSettings = () => {
    // Open app settings where they can grant the permission
    Linking.openSettings();
  };

  // If both are true, don't show the overlay
  if (hasPermission && hasServicesEnabled) {
    return null;
  }

  return (
    <View 
      className="absolute inset-0 justify-center items-center p-6"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 9999, // Make sure it sits on top of everything
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
          elevation: 10
        }}
      >
        <View className="w-20 h-20 rounded-full bg-red-100 justify-center items-center mb-6">
          <Ionicons name="location" size={40} color="#EF4444" />
        </View>

        <Text className="text-2xl font-black text-gray-800 mb-3 text-center">
          {!hasServicesEnabled ? "Location is Off" : "Location Permission"}
        </Text>

        <Text 
          className="text-base text-gray-600 text-center mb-8"
          style={{ lineHeight: 24 }}
        >
          {!hasServicesEnabled 
            ? "Your device's location services are turned off. AmbuLink requires your location to find nearby ambulances and provide critical emergency routing."
            : "AmbuLink requires access to your location to accurately dispatch emergency services and track ambulance routes. Please enable location sharing in your settings."
          }
        </Text>

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
