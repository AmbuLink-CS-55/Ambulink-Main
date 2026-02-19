import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  loadBookingHistory,
  clearBookingHistory,
  subscribeBookingHistory,
} from "@/utils/bookingHistory";

export default function History() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);

  const load = async () => {
    setLoading(true);
    const history = await loadBookingHistory("PATIENT");
    setItems(history);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const unsubscribe = subscribeBookingHistory("PATIENT", (next) => {
      setItems(next);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-4 py-3 flex-row items-center justify-between">
        <Text className="text-xl font-bold text-gray-900">Booking History</Text>
        <TouchableOpacity
          className="px-3 py-2 rounded-lg bg-gray-200"
          onPress={async () => {
            await clearBookingHistory("PATIENT");
            load();
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
          {items.length === 0 ? (
            <View className="items-center justify-center mt-24">
              <Text className="text-gray-500">No past bookings yet.</Text>
            </View>
          ) : (
            items.map((item) => (
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
                  {item.driverName ?? "Unknown Driver"}
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
