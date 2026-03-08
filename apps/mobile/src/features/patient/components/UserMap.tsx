import React from "react";
import { View, StyleSheet, Pressable, Text } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BookingStatus, Point } from "@ambulink/types";
import ambulanceIcon from "../../../../assets/images/ambu.png";
import { useFetchRoute } from "@/common/hooks/use-fetch-route";
import type { NearbyHospital } from "@/common/lib/hospitals";
import type { NearbyDriver } from "@/common/lib/drivers";
import { AppImage as Image } from "@/common/components";

type Props = {
  userLocation: Point;
  driverLocations?: Point[];
  hospitalLocation?: Point;
  bookingStatus?: BookingStatus;
  nearbyHospitals?: NearbyHospital[];
  nearbyDrivers?: NearbyDriver[];
  topOverlay?: React.ReactNode;
  children?: React.ReactNode;
};

export default function UserMap({
  userLocation,
  driverLocations = [],
  hospitalLocation,
  bookingStatus,
  nearbyHospitals = [],
  nearbyDrivers = [],
  topOverlay,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const mapRef = React.useRef<MapView>(null);
  const isValidPoint = (point?: Point) =>
    Boolean(point && Number.isFinite(point.x) && Number.isFinite(point.y));
  const safeUserLocation = isValidPoint(userLocation) ? userLocation : { x: 0, y: 0 };
  const safeDriverLocation = driverLocations.find((point) => isValidPoint(point));
  const safeHospitalLocation = isValidPoint(hospitalLocation) ? hospitalLocation : undefined;
  const showDriverEta = bookingStatus !== "ARRIVED" && bookingStatus !== "PICKEDUP";

  const { routeCoords: patientDriverCord, durationSeconds: patientDriverEtaSeconds } =
    useFetchRoute(safeUserLocation, showDriverEta ? safeDriverLocation : undefined);
  const { routeCoords: patientHospitalCord, durationSeconds: patientHospitalEtaSeconds } =
    useFetchRoute(safeUserLocation, safeHospitalLocation);

  const formatEta = (durationSeconds?: number | null) => {
    if (!Number.isFinite(durationSeconds) || (durationSeconds ?? 0) <= 0) return "Calculating...";
    const minutes = Math.round((durationSeconds ?? 0) / 60);
    if (minutes <= 1) return "<1 min";
    return `${minutes} min`;
  };

  const region: Region = {
    latitude: safeUserLocation.y,
    longitude: safeUserLocation.x,
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
        {driverLocations.filter(isValidPoint).map((d) => (
          // <Marker
          //   key={`driver:marker${i}`}
          //   coordinate={{ latitude: d.y, longitude: d.x }}
          //   anchor={{ x: 0.5, y: 1 }}
          //   tracksViewChanges={true}
          // />
          <Marker
            key={`driver-${d.x}-${d.y}`}
            coordinate={{ latitude: d.y, longitude: d.x }}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              {/*<Svg width="30" height="30" viewBox="0 0 100 100">
                <Circle cx="50" cy="50" r="45" stroke="blue" strokeWidth="5" fill="skyblue" />
              </Svg>*/}
              <Image
                source={ambulanceIcon}
                style={{ width: 40, height: 40 }}
                contentFit="contain"
              />
            </View>
          </Marker>
        ))}

        {nearbyDrivers
          .filter((driver) => isValidPoint(driver.location ?? undefined))
          .map((driver) => (
            <Marker
              key={`nearby-driver-${driver.id}`}
              coordinate={{
                latitude: driver.location!.y,
                longitude: driver.location!.x,
              }}
              pinColor="#2563eb"
              title={driver.fullName ?? "Nearby Driver"}
              description={`${driver.distanceKm.toFixed(1)} km away`}
              tracksViewChanges={false}
            />
          ))}

        {safeHospitalLocation && showDriverEta && safeDriverLocation && patientDriverCord.length > 0 && (
          <Polyline coordinates={patientDriverCord} strokeWidth={4} strokeColor="#007AFF" />
        )}
        {safeHospitalLocation && patientHospitalCord.length > 0 && (
          <Polyline coordinates={patientHospitalCord} strokeWidth={4} strokeColor="#FF3B30" />
        )}

        {safeHospitalLocation && (
          <Marker
            key={`${safeHospitalLocation.x}-${safeHospitalLocation.y}`}
            coordinate={{
              latitude: safeHospitalLocation.y,
              longitude: safeHospitalLocation.x,
            }}
            title="Hospital"
            pinColor="#dc2626"
            tracksViewChanges={false}
          />
        )}

        {nearbyHospitals
          .filter((hospital) => isValidPoint(hospital.location ?? undefined))
          .map((hospital) => (
            <Marker
              key={`nearby-hospital-${hospital.id}`}
              coordinate={{
                latitude: hospital.location!.y,
                longitude: hospital.location!.x,
              }}
              pinColor="#dc2626"
              title={hospital.name}
              description={`${hospital.distanceKm.toFixed(1)} km away`}
              tracksViewChanges={false}
            />
          ))}
      </MapView>
      {topOverlay ? (
        <View pointerEvents="box-none" className="absolute left-0 right-0 top-0 z-30">
          {topOverlay}
        </View>
      ) : null}
      <View
        className="items-center flex-1 justify-end mx-10"
        style={{ paddingBottom: Math.max(insets.bottom, 12), paddingTop: 20 }}
      >
        <Pressable
          className="bg-card p-1 rounded-md self-end mr-0 m-3 shadow-lg"
          onPress={handleLocate}
          accessibilityRole="button"
          accessibilityLabel="Center map on your location"
          accessibilityHint="Moves the map camera to your current position."
          hitSlop={10}
        >
          <Ionicons name="locate" size={24} color="#000000" />
        </Pressable>

        {safeHospitalLocation && safeDriverLocation && (
          <View className="w-full rounded-xl bg-card px-4 py-3 shadow-lg mb-3">
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-[#007AFF] mr-2" />
                  <Text className="text-xs text-muted-foreground">Driver ETA</Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {showDriverEta ? formatEta(patientDriverEtaSeconds) : "Arrived"}
                </Text>
              </View>
              <View>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full bg-[#FF3B30] mr-2" />
                  <Text className="text-xs text-muted-foreground">Hospital ETA</Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {formatEta(patientHospitalEtaSeconds)}
                </Text>
              </View>
            </View>
          </View>
        )}

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
