import { memo, useCallback } from "react";
import type { EmtBookingSearchResult } from "@ambulink/types";
import { FlatList, Pressable, RefreshControl, Text, View } from "react-native";

type Props = {
  data: EmtBookingSearchResult[];
  onSelect: (bookingId: string) => void;
  refreshing: boolean;
  onRefresh: () => void;
  isSubscribing: boolean;
};

type BookingPickerItemProps = {
  item: EmtBookingSearchResult;
  onSelect: (bookingId: string) => void;
  isSubscribing: boolean;
};

const BookingPickerItem = memo(function BookingPickerItem({
  item,
  onSelect,
  isSubscribing,
}: BookingPickerItemProps) {
  const handlePress = useCallback(() => onSelect(item.bookingId), [item.bookingId, onSelect]);

  return (
    <Pressable
      disabled={isSubscribing}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={`Subscribe booking ${item.shortId}`}
      className="px-3 py-3 border-b border-border"
    >
      <Text className="text-foreground font-medium">
        {item.shortId} • {item.status}
      </Text>
      <Text className="text-xs text-muted-foreground mt-0.5">{item.bookingId}</Text>
    </Pressable>
  );
});

export default function BookingPickerList({
  data,
  onSelect,
  refreshing,
  onRefresh,
  isSubscribing,
}: Props) {
  const renderItem = useCallback(
    ({ item }: { item: EmtBookingSearchResult }) => (
      <BookingPickerItem item={item} onSelect={onSelect} isSubscribing={isSubscribing} />
    ),
    [isSubscribing, onSelect]
  );

  return (
    <View className="mt-2 rounded-xl border border-border bg-card max-h-80 overflow-hidden">
      <FlatList
        data={data}
        keyExtractor={(item) => item.bookingId}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text className="p-3 text-sm text-muted-foreground">No active booking IDs found.</Text>
        }
        renderItem={renderItem}
      />
    </View>
  );
}
