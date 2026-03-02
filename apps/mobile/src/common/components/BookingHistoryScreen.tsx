import { useCallback } from "react";
import { ActivityIndicator, FlatList, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useBookingHistory } from "@/common/hooks/useBookingHistory";
import type { BookingHistoryRole } from "@/common/utils/bookingHistory";

type BookingHistoryScreenProps = {
  role: BookingHistoryRole;
  title?: string;
};

type BookingCardProps = {
  createdAt: string;
  status: "COMPLETED" | "CANCELLED";
  personName: string;
  hospitalName: string;
  providerName?: string | null;
};

function BookingCard({
  createdAt,
  status,
  personName,
  hospitalName,
  providerName,
}: BookingCardProps) {
  return (
    <View className="mb-3 p-4 bg-card rounded-2xl border border-border shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-muted-foreground">{createdAt}</Text>
        <Text
          className={`text-xs font-semibold ${status === "COMPLETED" ? "text-green-600" : "text-red-500"}`}
        >
          {status}
        </Text>
      </View>
      <Text className="text-base font-semibold text-foreground mt-2">{personName}</Text>
      <Text className="text-sm text-muted-foreground mt-1">Hospital: {hospitalName}</Text>
      {providerName ? (
        <Text className="text-sm text-muted-foreground mt-1">Provider: {providerName}</Text>
      ) : null}
    </View>
  );
}

export default function BookingHistoryScreen({
  role,
  title = "Booking History",
}: BookingHistoryScreenProps) {
  const { items, loading, reload, clear } = useBookingHistory(role);
  const unknownPerson = role === "PATIENT" ? "Unknown Driver" : "Unknown Patient";

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => undefined;
    }, [reload])
  );

  const onClear = useCallback(async () => {
    await clear();
    reload();
  }, [clear, reload]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-foreground">{title}</Text>
        <Pressable className="px-3 py-2 rounded-lg bg-muted" onPress={onClear}>
          <Text className="text-foreground font-semibold text-sm">Clear</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ef4444" />
          <Text className="mt-3 text-muted-foreground">Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-24">
              <Text className="text-muted-foreground">No past bookings yet.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <BookingCard
              createdAt={item.createdAt}
              status={item.status}
              personName={
                role === "PATIENT"
                  ? (item.driverName ?? unknownPerson)
                  : (item.patientName ?? unknownPerson)
              }
              hospitalName={item.hospitalName ?? "Unknown"}
              providerName={item.providerName}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}
