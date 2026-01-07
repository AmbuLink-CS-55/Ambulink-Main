import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";

type LatLng = {
  latitude: number;
  longitude: number;
};

type Props = {
  userLocation: LatLng;
  driverLocations?: LatLng[];
};

export default function UserMap({ userLocation, driverLocations = [] }: Props) {
  const region: Region = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <MapView
      style={StyleSheet.absoluteFillObject}
      initialRegion={region}
      provider={PROVIDER_GOOGLE}
      showsUserLocation
      showsMyLocationButton
    >
      <Marker
        coordinate={userLocation}
        title="Your Location"
        description={`${userLocation.latitude}, ${userLocation.longitude}`}
      />
    </MapView>
  );
}
