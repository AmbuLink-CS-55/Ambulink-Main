import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
import { AppCard } from "@/common/components/ui/AppCard";
import { AppButton } from "@/common/components/ui/AppButton";
import { StatusPill } from "@/common/components/ui/StatusPill";

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
    <AppCard className="w-full min-w-[100%]" variant="sheet">
      <View className="flex-row items-center mb-3 gap-2">
        <StatusPill label={status} tone="brand" />
        <View className="flex-1">
          <Text className="text-sm text-muted-foreground">Selected Booking</Text>
          <Text className="text-lg font-bold text-foreground mt-0.5">{bookingId.slice(0, 8)}</Text>
        </View>
        <Ionicons name="medkit-outline" size={18} color="#111827" />
      </View>

      <View className="border-t border-border pt-3" />

      <View className="flex-row gap-2 mt-4">
        <AppButton
          className="flex-1"
          onPress={onViewPatientInfo}
          accessibilityLabel="Open booking information"
          variant="primary"
          label="Booking Info"
        />
        <AppButton
          className="flex-1"
          onPress={onOpenNotes}
          accessibilityLabel="Open booking notes"
          variant="secondary"
          label="Add Note"
        />
      </View>
    </AppCard>
  );
}
