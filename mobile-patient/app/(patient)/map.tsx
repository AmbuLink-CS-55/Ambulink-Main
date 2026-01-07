import UserMap from "@/src/components/UserMap";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";


export default function Map() {



  return (
    <SafeAreaView style={{ flex: 1 }} >
      <UserMap userLocation={{
        latitude: 6.898527830579406,
        longitude: 79.85385178316076
      }} />

    </SafeAreaView>
  );
}
