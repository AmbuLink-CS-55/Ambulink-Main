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
    <View style={{
      position: 'absolute',
      top: 0, bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
      zIndex: 9999, // Make sure it sits on top of everything
      elevation: 9999
    }}>
      <View style={{
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10
      }}>
        <View style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#FEE2E2', // red-100
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24
        }}>
          <Ionicons name="location" size={40} color="#EF4444" />
        </View>

        <Text style={{
          fontSize: 24,
          fontWeight: '900',
          color: '#1F2937',
          marginBottom: 12,
          textAlign: 'center'
        }}>
          {!hasServicesEnabled ? "Location is Off" : "Location Permission"}
        </Text>

        <Text style={{
          fontSize: 16,
          color: '#4B5563',
          textAlign: 'center',
          lineHeight: 24,
          marginBottom: 32
        }}>
          {!hasServicesEnabled 
            ? "Your device's location services are turned off. AmbuLink requires your location to find nearby ambulances and provide critical emergency routing."
            : "AmbuLink requires access to your location to accurately dispatch emergency services and track ambulance routes. Please enable location sharing in your settings."
          }
        </Text>

        <Pressable
          onPress={handleOpenSettings}
          style={({ pressed }) => ({
            backgroundColor: '#1e5bb5',
            width: '100%',
            height: 56,
            borderRadius: 16,
            justifyContent: 'center',
            alignItems: 'center',
            opacity: pressed ? 0.8 : 1,
            shadowColor: '#1e5bb5',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4
          })}
        >
          <Text style={{
            color: 'white',
            fontSize: 18,
            fontWeight: 'bold'
          }}>
            Open Settings
          </Text>
        </Pressable>
        
        {/* For testing/demo purposes, you might want a way to dismiss, but strictly the user wants a forced popup */}
      </View>
    </View>
  );
}
