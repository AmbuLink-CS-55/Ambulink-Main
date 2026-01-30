import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

type LatLng = {
  lat: number;
  lng: number;
};

type Props = {
  userLocation: LatLng;
  driverLocations?: LatLng[];
  children?: React.ReactNode;
};

export default function UserMap({ userLocation, driverLocations = [], children }: Props) {
  const mapRef = React.useRef<MapView>(null);

  const region: Region = {
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleLocate = () => {
    mapRef.current?.animateToRegion(region, 1000);
  };

  return (
    <View className="flex-1">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
        showsPointsOfInterest={false}
      >
        {driverLocations.map((d) => (
          <Marker
            key={`${d.lat}-${d.lng}`}
            coordinate={{ latitude: d.lat, longitude: d.lng }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          />
        ))}
      </MapView>
      <View className="items-center flex-1 justify-end my-5 mx-10">
        <TouchableOpacity
          className="bg-white p-1 rounded-md self-end mr-0 m-3 shadow-lg"
          onPress={handleLocate}
        >
          <Ionicons name="locate" size={24} color="#000000" />
        </TouchableOpacity>

        {children}
      </ View>
    </View>
  );
}

const mapStyle = [
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
];
