import UserMap from "@/src/components/UserMap";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";


type LatLng = {
  latitude: number;
  longitude: number;
};

export default function Map() {

  const drivers: LatLng[] = [
    { latitude: 6.898356108714619, longitude: 79.85389578706928 },
    { latitude: 6.895353174577009, longitude: 79.85387845284518 },
    { latitude: 6.893795771439718, longitude: 79.85671259848431 },
  ];

  return (
    <SafeAreaView style={{ flex: 1 }} >
      <UserMap
        driverLocations={drivers}
        userLocation={{
          latitude: 6.898527830579406,
          longitude: 79.85385178316076
        }} />

    </SafeAreaView>
  );
}
