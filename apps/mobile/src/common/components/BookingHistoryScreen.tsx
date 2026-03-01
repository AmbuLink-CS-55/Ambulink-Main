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
    <View className="mb-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
      <View className="flex-row items-center justify-between">
        <Text className="text-xs text-gray-500">{createdAt}</Text>
        <Text
          className={`text-xs font-semibold ${status === "COMPLETED" ? "text-green-600" : "text-red-500"}`}
        >
          {status}
        </Text>
      </View>
      <Text className="text-base font-semibold text-gray-900 mt-2">{personName}</Text>
      <Text className="text-sm text-gray-500 mt-1">Hospital: {hospitalName}</Text>
      {providerName ? (
        <Text className="text-sm text-gray-500 mt-1">Provider: {providerName}</Text>
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
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">{title}</Text>
        <Pressable className="px-3 py-2 rounded-lg bg-gray-200" onPress={onClear}>
          <Text className="text-gray-700 font-semibold text-sm">Clear</Text>
        </Pressable>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ef4444" />
          <Text className="mt-3 text-gray-500">Loading history...</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          ListEmptyComponent={
            <View className="items-center justify-center mt-24">
              <Text className="text-gray-500">No past bookings yet.</Text>
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
