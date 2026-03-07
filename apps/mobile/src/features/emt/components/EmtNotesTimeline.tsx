import { useMemo } from "react";
import type { EmtNote } from "@ambulink/types";
import { FlatList, StyleSheet, Text, View } from "react-native";

type Props = {
  notes: EmtNote[];
};

export default function EmtNotesTimeline({ notes }: Props) {
  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }),
    []
  );

  const formattedNotes = useMemo(
    () =>
      [...notes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map((note) => ({
          ...note,
          formattedCreatedAt: formatter.format(new Date(note.createdAt)),
        })),
    [formatter, notes]
  );

  return (
    <FlatList
      data={formattedNotes}
      keyExtractor={(item) => item.id}
      scrollEnabled
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      style={styles.list}
      contentContainerStyle={formattedNotes.length === 0 ? styles.emptyContent : styles.content}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No notes yet. Add the first update.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.noteCard}>
          <Text style={styles.noteContent}>{item.content}</Text>
          <Text style={styles.noteTimestamp}>{item.formattedCreatedAt}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  content: {
    paddingTop: 4,
    paddingBottom: 10,
  },
  emptyContent: {
    flexGrow: 1,
    paddingTop: 4,
    paddingBottom: 10,
  },
  emptyState: {
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    color: "#636363",
  },
  noteCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  noteContent: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
  noteTimestamp: {
    fontSize: 12,
    color: "#636363",
    marginTop: 4,
  },
});
