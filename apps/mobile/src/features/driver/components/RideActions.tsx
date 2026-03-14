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
  const isCallDisabled = !currentRide || !isOnShift;
  const isArrivedDisabled = rideStatus !== "ASSIGNED" || isArrivedUpdating;
  const isCompletedDisabled = rideStatus !== "ARRIVED" || isCompletedUpdating;

  return (
    <View className="mt-3">
      <Pressable
        onPress={() => onCall(currentRide?.patient.phoneNumber ?? undefined)}
        disabled={isCallDisabled}
        accessibilityRole="button"
        accessibilityLabel="Call patient"
        className={`p-4 mt-3 rounded-xl items-center border ${isCallDisabled ? "bg-secondary border-border" : "bg-card border-border"}`}
      >
        <Text
          className={`font-bold ${isCallDisabled ? "text-secondary-foreground" : "text-foreground"}`}
        >
          Call Patient
        </Text>
      </Pressable>

      <Pressable
        onPress={onArrived}
        disabled={isArrivedDisabled}
        accessibilityRole="button"
        accessibilityLabel="Mark arrived"
        accessibilityState={{ disabled: isArrivedDisabled, busy: isArrivedUpdating }}
        className={`p-4 mt-3 rounded-xl items-center border ${!isArrivedDisabled ? "bg-yellow-400 border-yellow-500" : "bg-secondary border-border"}`}
      >
        {isArrivedUpdating ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#111827" />
            <Text className="font-bold">Updating...</Text>
          </View>
        ) : (
          <Text className={`font-bold ${isArrivedDisabled ? "text-secondary-foreground" : "text-black"}`}>
            Arrived
          </Text>
        )}
      </Pressable>

      <Pressable
        onPress={onCompleted}
        disabled={isCompletedDisabled}
        accessibilityRole="button"
        accessibilityLabel="Complete ride"
        accessibilityState={{ disabled: isCompletedDisabled, busy: isCompletedUpdating }}
        className={`p-4 mt-3 rounded-xl items-center border ${!isCompletedDisabled ? "bg-green-500 border-green-600" : "bg-secondary border-border"}`}
      >
        {isCompletedUpdating ? (
          <View className="flex-row items-center gap-2">
            <ActivityIndicator color="#ffffff" />
            <Text className="text-white font-bold">Completing...</Text>
          </View>
        ) : (
          <Text
            className={`font-bold ${isCompletedDisabled ? "text-secondary-foreground" : "text-white"}`}
          >
            Complete Ride
          </Text>
        )}
      </Pressable>
    </View>
  );
}
