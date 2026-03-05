import type { EmtNote } from "@ambulink/types";
import { FlatList, Text, View } from "react-native";

type Props = {
  notes: EmtNote[];
};

export default function EmtNotesTimeline({ notes }: Props) {
  return (
    <FlatList
      data={notes}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <View className="py-6">
          <Text className="text-sm text-muted-foreground">No notes yet. Add the first update.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View className="bg-card border border-border rounded-xl p-3 mb-2">
          <Text className="text-sm text-foreground">{item.content}</Text>
          <Text className="text-xs text-muted-foreground mt-1">{new Date(item.createdAt).toLocaleString()}</Text>
        </View>
      )}
    />
  );
}
