import { Pressable, Text, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { isValidPoint, type MapPoint, type Ride, type RideMapRegion } from "./types";

type RideMapCardProps = {
  currentRide: Ride | null;
  pickupPoint: MapPoint | null;
  mapRegion: RideMapRegion;
  isOnShift: boolean;
  onOpenOnMap: () => void;
};

export function RideMapCard({
  currentRide,
  pickupPoint,
  mapRegion,
  isOnShift,
  onOpenOnMap,
}: RideMapCardProps) {
  const safePickupPoint = isValidPoint(pickupPoint) ? pickupPoint : null;
  const safeHospitalPoint = isValidPoint(currentRide?.hospital.location)
    ? currentRide?.hospital.location
    : null;
  const isNavigationDisabled = !currentRide || !isOnShift;

  return (
    <View className="rounded-2xl overflow-hidden shadow-sm bg-card border border-border">
      <View style={{ height: 220, width: "100%" }}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={{ flex: 1 }}
          showsPointsOfInterest={false}
          initialRegion={mapRegion}
        >
          {safePickupPoint ? (
            <Marker
              coordinate={{ latitude: safePickupPoint.y, longitude: safePickupPoint.x }}
              title="Pickup"
              pinColor="red"
            />
          ) : null}
          {safeHospitalPoint ? (
            <Marker
              coordinate={{
                latitude: safeHospitalPoint.y,
                longitude: safeHospitalPoint.x,
              }}
              title="Hospital"
              pinColor="blue"
            />
          ) : null}
        </MapView>
      </View>

      <Pressable
        className={`p-4 items-center justify-center border ${isNavigationDisabled ? "bg-secondary border-border" : "bg-green-500 border-green-600"}`}
        onPress={onOpenOnMap}
        disabled={isNavigationDisabled}
        accessibilityRole="button"
        accessibilityLabel="Open navigation"
      >
        <Text
          className={`font-bold text-lg ${isNavigationDisabled ? "text-secondary-foreground" : "text-white"}`}
        >
          Open in Navigation
        </Text>
      </Pressable>
    </View>
  );
}
