import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

type Props = {
  bookingId: string;
  status: string;
  onViewPatientInfo: () => void;
  onOpenNotes: () => void;
};

export default function EmtBottomActions({
  bookingId,
  status,
  onViewPatientInfo,
  onOpenNotes,
}: Props) {
  return (
    <View className="bg-card p-4 w-full rounded-2xl shadow-lg border border-border min-w-[100%]">
      <View className="flex-row items-center mb-3">
        <View className="bg-blue-100 p-2 rounded-full mr-3">
          <Ionicons name="medkit" size={18} color="#2563eb" />
        </View>
        <View className="flex-1">
          <Text className="text-sm text-muted-foreground">Selected Booking</Text>
          <Text className="text-lg font-bold text-foreground mt-0.5">
            {bookingId.slice(0, 8)} • {status}
          </Text>
        </View>
      </View>

      <View className="border-t border-border pt-3"></View>

      <View className="flex-row gap-2 mt-4">
        <Pressable
          onPress={onViewPatientInfo}
          accessibilityRole="button"
          accessibilityLabel="Open booking information"
          className="flex-1 min-h-12 rounded-xl bg-blue-500 items-center justify-center flex-row p-3"
        >
          <Ionicons name="person" size={16} color="white" />
          <Text className="text-white font-bold ml-2 text-base">Booking Info</Text>
        </Pressable>
        <Pressable
          onPress={onOpenNotes}
          accessibilityRole="button"
          accessibilityLabel="Open booking notes"
          className="flex-1 min-h-12 rounded-xl bg-emerald-500 items-center justify-center flex-row p-3"
        >
          <Ionicons name="document-text" size={16} color="white" />
          <Text className="text-white font-bold ml-2 text-base">Add Note</Text>
        </Pressable>
      </View>
    </View>
  );
}
