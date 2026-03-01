import { Pressable, Text, View } from "react-native";

type ShiftCardProps = {
  isOnShift: boolean;
  isShiftUpdating: boolean;
  onToggleShift: () => void;
};

export function ShiftCard({ isOnShift, isShiftUpdating, onToggleShift }: ShiftCardProps) {
  return (
    <View className="mb-4 rounded-2xl bg-card p-4 border border-border shadow-sm">
      <Text className="text-xs font-bold text-muted-foreground uppercase">Shift</Text>
      <Text className="mt-1 text-lg font-semibold text-foreground">
        {isOnShift ? "On Shift" : "Off Shift"}
      </Text>
      <Text className="mt-1 text-xs text-muted-foreground">
        {isOnShift
          ? "Location sharing is active for dispatch."
          : "Clock in to receive bookings and share location."}
      </Text>
      <Pressable
        className={`mt-3 rounded-xl p-3 items-center ${isOnShift ? "bg-red-500" : "bg-emerald-500"} ${isShiftUpdating ? "opacity-60" : ""}`}
        onPress={onToggleShift}
        disabled={isShiftUpdating}
      >
        <Text className="text-white font-bold">
          {isShiftUpdating ? "Updating..." : isOnShift ? "Clock Out" : "Clock In"}
        </Text>
      </Pressable>
    </View>
  );
}
