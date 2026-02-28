import React, { useEffect, useRef } from "react";
import MapView, { Marker, Region } from "react-native-maps";

type LatLng = { latitude: number; longitude: number };

export function DriverMap({ driverLocation }: { driverLocation: LatLng | null }) {
  const mapRef = useRef<MapView>(null);

  const initialRegion: Region = {
    latitude: driverLocation?.latitude ?? 37.78825,
    longitude: driverLocation?.longitude ?? -122.4324,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  useEffect(() => {
    if (!driverLocation) return;

    mapRef.current?.animateToRegion(
      {
        ...driverLocation,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  }, [driverLocation]);

  return (
    <MapView ref={mapRef} className="flex-1" initialRegion={initialRegion}>
      {driverLocation && <Marker coordinate={driverLocation} title="Driver" />}
    </MapView>
  );
}
