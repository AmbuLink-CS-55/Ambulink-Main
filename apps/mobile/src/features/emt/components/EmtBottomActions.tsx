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
    <View className="bg-card p-4 w-full rounded-2xl shadow-lg border border-border">
      <Text className="text-sm text-muted-foreground">Selected Booking</Text>
      <Text className="text-base font-semibold text-foreground mt-1">{bookingId.slice(0, 8)} • {status}</Text>

      <View className="flex-row gap-3 mt-4">
        <Pressable
          onPress={onViewPatientInfo}
          className="flex-1 min-h-12 rounded-xl bg-blue-500 items-center justify-center flex-row"
        >
          <Ionicons name="person" size={16} color="white" />
          <Text className="text-white font-bold ml-2">Patient Info</Text>
        </Pressable>
        <Pressable
          onPress={onOpenNotes}
          className="flex-1 min-h-12 rounded-xl bg-emerald-500 items-center justify-center flex-row"
        >
          <Ionicons name="document-text" size={16} color="white" />
          <Text className="text-white font-bold ml-2">Add Note</Text>
        </Pressable>
      </View>
    </View>
  );
}
