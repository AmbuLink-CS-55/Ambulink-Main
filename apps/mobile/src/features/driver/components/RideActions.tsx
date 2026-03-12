import { ActivityIndicator, Pressable, Text, View } from "react-native";
import type { Ride, RideStatus } from "./types";

type RideActionsProps = {
  isOnShift: boolean;
  currentRide: Ride | null;
  rideStatus: RideStatus;
  isArrivedUpdating: boolean;
  isCompletedUpdating: boolean;
  onCall: (phone?: string) => void;
  onArrived: () => void;
  onCompleted: () => void;
};

export function RideActions({
  isOnShift,
  currentRide,
  rideStatus,
  isArrivedUpdating,
  isCompletedUpdating,
  onCall,
  onArrived,
  onCompleted,
}: RideActionsProps) {
  const isArrivedDisabled = rideStatus !== "ASSIGNED" || isArrivedUpdating;
  const isCompletedDisabled = rideStatus !== "ARRIVED" || isCompletedUpdating;

  return (
    <View className="mt-3">
      <Pressable
        onPress={() => onCall(currentRide?.patient.phoneNumber ?? undefined)}
        disabled={!currentRide || !isOnShift}
        accessibilityRole="button"
        accessibilityLabel="Call patient"
        className={`p-4 mt-3 rounded-xl items-center ${currentRide && isOnShift ? "bg-card" : "bg-muted"}`}
      >
        <Text className="text-foreground font-bold">Call Patient</Text>
      </Pressable>

      <Pressable
        onPress={onArrived}
        disabled={isArrivedDisabled}
        accessibilityRole="button"
        accessibilityLabel="Mark arrived"
        accessibilityState={{ disabled: isArrivedDisabled, busy: isArrivedUpdating }}
        className={`p-4 mt-3 rounded-xl items-center ${!isArrivedDisabled ? "bg-yellow-400" : "bg-muted"}`}
      >
        {isArrivedUpdating ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#111827" />
            <Text className="font-bold">Updating...</Text>
          </View>
        ) : (
          <Text className="font-bold">Arrived</Text>
        )}
      </Pressable>

      <Pressable
        onPress={onCompleted}
        disabled={isCompletedDisabled}
        accessibilityRole="button"
        accessibilityLabel="Complete ride"
        accessibilityState={{ disabled: isCompletedDisabled, busy: isCompletedUpdating }}
        className={`p-4 mt-3 rounded-xl items-center ${!isCompletedDisabled ? "bg-green-500" : "bg-muted"}`}
      >
        {isCompletedUpdating ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#ffffff" />
            <Text className="text-white font-bold">Completing...</Text>
          </View>
        ) : (
          <Text className="text-white font-bold">Complete Ride</Text>
        )}
      </Pressable>
    </View>
  );
}
