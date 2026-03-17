import React from "react";
import { View, StyleSheet, Pressable, Text, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region, Polyline } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BookingStatus, Point } from "@ambulink/types";
import ambulanceIcon from "../../../../assets/images/ambu.png";
import { useFetchRoute } from "@/common/hooks/use-fetch-route";
import type { NearbyHospital } from "@/common/lib/hospitals";
import type { NearbyDriver } from "@/common/lib/drivers";
import { AppCard } from "@/common/components/ui/AppCard";

const DRIVER_MARKER_SIZE = 60;
const DRIVER_MARKER_ANCHOR = { x: 0.5, y: 0.5 };

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
  const DRIVER_ROUTE_COLOR = "#4f46e5";
  const HOSPITAL_ROUTE_COLOR = "#ea580c";
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
          <Marker
            key={`driver-${d.x}-${d.y}`}
            coordinate={{ latitude: d.y, longitude: d.x }}
            anchor={DRIVER_MARKER_ANCHOR}
            tracksViewChanges
          >
            <View style={styles.driverMarkerContainer} collapsable={false}>
              <Image
                source={ambulanceIcon}
                style={styles.driverMarker}
                resizeMode="contain"
                fadeDuration={0}
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
              title={driver.fullName ?? "Nearby Driver"}
              description={`${driver.distanceKm.toFixed(1)} km away`}
              anchor={{ x: 0.5, y: 0.5 }}
              image={ambulanceIcon}
              tracksViewChanges={false}
            />
          ))}

        {safeHospitalLocation &&
          showDriverEta &&
          safeDriverLocation &&
          patientDriverCord.length > 0 && (
            <Polyline
              coordinates={patientDriverCord}
              strokeWidth={4}
              strokeColor={DRIVER_ROUTE_COLOR}
            />
          )}
        {safeHospitalLocation && patientHospitalCord.length > 0 && (
          <Polyline
            coordinates={patientHospitalCord}
            strokeWidth={4}
            strokeColor={HOSPITAL_ROUTE_COLOR}
          />
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
          className="self-end m-3 h-11 w-11 items-center justify-center rounded-full border border-border bg-card"
          onPress={handleLocate}
          accessibilityRole="button"
          accessibilityLabel="Center map on your location"
          accessibilityHint="Moves the map camera to your current position."
          hitSlop={10}
        >
          <Ionicons name="locate" size={22} color="#111827" />
        </Pressable>

        {safeHospitalLocation && safeDriverLocation && (
          <AppCard className="w-full mb-3" variant="sheet">
            <View className="flex-row items-center justify-between">
              <View>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full mr-2 bg-map-driver-route" />
                  <Text className="text-xs text-muted-foreground">Driver ETA</Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {showDriverEta ? formatEta(patientDriverEtaSeconds) : "Arrived"}
                </Text>
              </View>
              <View>
                <View className="flex-row items-center">
                  <View className="h-2 w-2 rounded-full mr-2 bg-map-hospital-route" />
                  <Text className="text-xs text-muted-foreground">Hospital ETA</Text>
                </View>
                <Text className="text-base font-semibold text-foreground">
                  {formatEta(patientHospitalEtaSeconds)}
                </Text>
              </View>
            </View>
          </AppCard>
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

const styles = StyleSheet.create({
  driverMarkerContainer: {
    width: DRIVER_MARKER_SIZE,
    height: DRIVER_MARKER_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  driverMarker: {
    width: DRIVER_MARKER_SIZE,
    height: DRIVER_MARKER_SIZE,
  },
});
