import type { EmtBookingSearchResult } from "@ambulink/types";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

type Props = {
  data: EmtBookingSearchResult[];
  onSelect: (bookingId: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  isSubscribing: boolean;
};

export default function BookingPickerList({
  data,
  onSelect,
  refreshing,
  onRefresh,
  isSubscribing,
}: Props) {
  return (
    <View className="mt-2 rounded-xl border border-border bg-card max-h-56 overflow-hidden">
      <FlatList
        data={data}
        keyExtractor={(item) => item.bookingId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text className="p-3 text-sm text-muted-foreground">No active booking IDs found.</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            disabled={isSubscribing}
            onPress={() => onSelect(item.bookingId)}
            className="px-3 py-3 border-b border-border"
          >
            <Text className="text-foreground font-medium">{item.shortId} • {item.status}</Text>
            <Text className="text-xs text-muted-foreground mt-0.5">{item.bookingId}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
