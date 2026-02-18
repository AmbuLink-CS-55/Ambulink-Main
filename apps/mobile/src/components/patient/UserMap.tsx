import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import { Point } from "@ambulink/types";
import ambulanceIcon from "../../../assets/images/ambu.png";
import Svg, { Path, Circle, Rect } from "react-native-svg";
import { useFetchRoute } from "@/hooks/use-fetch-route";

type Props = {
  userLocation: Point;
  driverLocations?: Point[];
  hospitalLocation?: Point;
  children?: React.ReactNode;
};

export default function UserMap({
  userLocation,
  driverLocations = [],
  hospitalLocation,
  children,
}: Props) {
  const mapRef = React.useRef<MapView>(null);
  const patientDriverCord = useFetchRoute(userLocation, driverLocations[0]);
  const patientHospitalCord = useFetchRoute(userLocation, hospitalLocation);

  const region: Region = {
    latitude: userLocation.y,
    longitude: userLocation.x,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const handleLocate = () => {
    mapRef.current?.animateToRegion(region, 1000);
    console.log(driverLocations);
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
        {driverLocations.map((d, i) => (
          // <Marker
          //   key={`driver:marker${i}`}
          //   coordinate={{ latitude: d.y, longitude: d.x }}
          //   anchor={{ x: 0.5, y: 1 }}
          //   tracksViewChanges={true}
          // />
          <Marker
            key={`d${i}`}
            coordinate={{ latitude: d.y, longitude: d.x }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={true}
          >
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {/*<Svg width="30" height="30" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="45" stroke="blue" strokeWidth="5" fill="skyblue" />
              </Svg>*/}
              <Image
                source={ambulanceIcon}
                style={{ width: 40, height: 40 }}
                resizeMode="contain"
              />
            </View>
          </Marker>
        ))}

        {hospitalLocation && driverLocations.length > 0 && (
          <>
            {patientDriverCord.length > 0 && (
              <Polyline coordinates={patientDriverCord} strokeWidth={4} strokeColor="#007AFF" />
            )}
            {patientHospitalCord.length > 0 && (
              <Polyline coordinates={patientHospitalCord} strokeWidth={4} strokeColor="#FF3B30" />
            )}
          </>
        )}

        {hospitalLocation && (
          <Marker
            key={`${hospitalLocation.x}-${hospitalLocation.y}`}
            coordinate={{
              latitude: hospitalLocation.y,
              longitude: hospitalLocation.x,
            }}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges={false}
          >
            <View
              style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
            ></View>
          </Marker>
        )}
      </MapView>
      <View className="items-center flex-1 justify-end my-5 mx-10">
        <TouchableOpacity
          className="bg-white p-1 rounded-md self-end mr-0 m-3 shadow-lg"
          onPress={handleLocate}
        >
          <Ionicons name="locate" size={24} color="#000000" />
        </TouchableOpacity>

        {children}
      </View>
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
