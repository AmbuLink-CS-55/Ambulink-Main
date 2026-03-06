import { Pressable, Text, View } from "react-native";
import type { Ride, RideStatus } from "./types";

type RideActionsProps = {
  isOnShift: boolean;
  currentRide: Ride | null;
  rideStatus: RideStatus;
  onCall: (phone?: string) => void;
  onArrived: () => void;
  onCompleted: () => void;
};

export function RideActions({
  isOnShift,
  currentRide,
  rideStatus,
  onCall,
  onArrived,
  onCompleted,
}: RideActionsProps) {
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
        disabled={rideStatus !== "ASSIGNED"}
        accessibilityRole="button"
        accessibilityLabel="Mark arrived"
        className={`p-4 mt-3 rounded-xl items-center ${rideStatus === "ASSIGNED" ? "bg-yellow-400" : "bg-muted"}`}
      >
        <Text className="font-bold">Arrived</Text>
      </Pressable>

      <Pressable
        onPress={onCompleted}
        disabled={rideStatus !== "ARRIVED"}
        accessibilityRole="button"
        accessibilityLabel="Complete ride"
        className={`p-4 mt-3 rounded-xl items-center ${rideStatus === "ARRIVED" ? "bg-green-500" : "bg-muted"}`}
      >
        <Text className="text-white font-bold">Complete Ride</Text>
      </Pressable>
    </View>
  );
}
