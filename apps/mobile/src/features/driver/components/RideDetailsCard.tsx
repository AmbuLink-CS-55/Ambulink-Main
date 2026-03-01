import { Text, View } from "react-native";
import type { Ride, RideStatus } from "./types";

type RideDetailsCardProps = {
  currentRide: Ride | null;
  rideStatus: RideStatus;
};

export function RideDetailsCard({ currentRide, rideStatus }: RideDetailsCardProps) {
  return (
    <View className="mt-6 p-5 bg-card rounded-2xl shadow-sm border border-border">
      <Text className="text-xs font-bold text-muted-foreground uppercase mb-3">Ride Details</Text>
      <DetailItem label="Patient Name" value={currentRide?.patient.fullName ?? "None"} />
      <DetailItem label="Hospital" value={currentRide?.hospital.name ?? "None"} />
      <DetailItem label="Status" value={rideStatus} />
    </View>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <View className="mb-3">
      <Text className="text-muted-foreground text-sm">{label}</Text>
      <Text className="text-foreground font-semibold text-base">{value}</Text>
    </View>
  );
}
