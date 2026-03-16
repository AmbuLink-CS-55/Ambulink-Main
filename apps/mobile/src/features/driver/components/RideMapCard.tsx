import { View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { isValidPoint, type MapPoint, type Ride, type RideMapRegion } from "./types";
import { AppCard } from "@/common/components/ui/AppCard";
import { AppButton } from "@/common/components/ui/AppButton";

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
    <AppCard className="overflow-hidden px-0 py-0" variant="elevated">
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

      <AppButton
        className="rounded-none border-x-0 border-b-0"
        onPress={onOpenOnMap}
        disabled={isNavigationDisabled}
        accessibilityRole="button"
        accessibilityLabel="Open navigation"
        variant="primary"
        label="Open in Navigation"
      />
    </AppCard>
  );
}
