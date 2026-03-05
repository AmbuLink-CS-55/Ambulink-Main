import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { PatientProfileCard } from "@/features/emt/components";
import { useEmtBookingState } from "@/features/emt/hooks/useEmtBookingState";

export default function PatientInfoScreen() {
  const booking = useEmtBookingState((state) => state.activeBooking);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {!booking ? (
          <View className="bg-card p-4 rounded-2xl border border-border">
            <Text className="text-lg font-bold text-foreground">No Booking Selected</Text>
            <Text className="text-sm text-muted-foreground mt-2">
              Subscribe to a booking from the EMT map screen to view patient details.
            </Text>
          </View>
        ) : (
          <PatientProfileCard booking={booking} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
