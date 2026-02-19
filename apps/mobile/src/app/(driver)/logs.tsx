import { useMemo, useCallback } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useBookingHistory } from "@/hooks/useBookingHistory";

export default function Logs() {
  const { items, loading, reload, clear } = useBookingHistory("DRIVER");

  useFocusEffect(
    useCallback(() => {
      reload();
      return () => undefined;
    }, [reload])
  );

  const list = useMemo(() => items, [items]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">Booking History</Text>
        <TouchableOpacity
          className="px-3 py-2 rounded-lg bg-gray-200"
          onPress={async () => {
            await clear();
            reload();
          }}
        >
          <Text className="text-gray-700 font-semibold text-sm">Clear</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#ef4444" />
          <Text className="mt-3 text-gray-500">Loading history...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {list.length === 0 ? (
            <View className="items-center justify-center mt-24">
              <Text className="text-gray-500">No past bookings yet.</Text>
            </View>
          ) : (
            list.map((item) => (
              <View
                key={item.id}
                className="mb-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs text-gray-500">{item.createdAt}</Text>
                  <Text
                    className={`text-xs font-semibold ${
                      item.status === "COMPLETED" ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {item.status}
                  </Text>
                </View>
                <Text className="text-base font-semibold text-gray-900 mt-2">
                  {item.patientName ?? "Unknown Patient"}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Hospital: {item.hospitalName ?? "Unknown"}
                </Text>
                {item.providerName && (
                  <Text className="text-sm text-gray-500 mt-1">Provider: {item.providerName}</Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
