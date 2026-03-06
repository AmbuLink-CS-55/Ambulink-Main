import { Pressable, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { PatientProfileCard } from "@/features/emt/components";
import { useEmtBookingState } from "@/features/emt/hooks/useEmtBookingState";

export default function PatientInfoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const booking = useEmtBookingState((state) => state.activeBooking);

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right", "bottom"]}>
      <View className="px-4 pt-2 pb-1">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 rounded-full bg-card border border-border items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#111827" />
        </Pressable>
      </View>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ padding: 16, paddingBottom: Math.max(insets.bottom + 16, 24) }}
      >
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
