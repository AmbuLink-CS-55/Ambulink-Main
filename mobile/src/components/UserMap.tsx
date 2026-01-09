import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Image } from "react-native";

const driverIcon = require("../../assets/images/icon.png");

type LatLng = {
  latitude: number;
  longitude: number;
};

type Props = {
  userLocation: LatLng;
  driverLocations?: LatLng[];
  children?: React.ReactNode;
};

export default function UserMap({ userLocation, driverLocations = [], children }: Props) {
  const region: Region = {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={region}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton
        customMapStyle={mapStyle}
        showsPointsOfInterest={false}
      >
        {driverLocations.map((d) => (
          <Marker
            key={`${d.latitude}-${d.longitude}`}
            coordinate={d}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            {/*<Image source={driverIcon} style={styles.markerIcon} />*/}
          </Marker>
        ))}
      </MapView >
      <View style={styles.buttonContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  markerIcon: {
    width: 36,
    height: 36,
    resizeMode: "contain",
  },
  buttonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "transparent",
  },
});

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
