import { View } from "react-native";
import type { Ride, RideStatus } from "./types";
import { AppButton } from "@/common/components/ui/AppButton";

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
      <AppButton
        onPress={() => onCall(currentRide?.patient.phoneNumber ?? undefined)}
        disabled={isCallDisabled}
        accessibilityRole="button"
        accessibilityLabel="Call patient"
        className="mt-3"
        variant="secondary"
        label="Call Patient"
      />

      <AppButton
        onPress={onArrived}
        disabled={isArrivedDisabled}
        accessibilityRole="button"
        accessibilityLabel="Mark arrived"
        accessibilityState={{ disabled: isArrivedDisabled, busy: isArrivedUpdating }}
        className="mt-3"
        variant="secondary"
        label="Arrived"
        loading={isArrivedUpdating}
      />

      <AppButton
        onPress={onCompleted}
        disabled={isCompletedDisabled}
        accessibilityRole="button"
        accessibilityLabel="Complete ride"
        accessibilityState={{ disabled: isCompletedDisabled, busy: isCompletedUpdating }}
        className="mt-3"
        variant="success"
        label="Complete Ride"
        loading={isCompletedUpdating}
      />
    </View>
  );
}
