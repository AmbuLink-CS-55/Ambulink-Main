import { useMemo } from "react";
import type { EmtNote } from "@ambulink/types";
import { FlatList, StyleSheet, Text, View } from "react-native";

type Props = {
  notes: EmtNote[];
  currentEmtId: string;
};

export default function EmtNotesTimeline({ notes, currentEmtId }: Props) {
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
          <View style={styles.noteMetaRow}>
            <View style={styles.authorTag}>
              <Text style={styles.authorTagText}>{getNoteAuthorLabel(item, currentEmtId)}</Text>
            </View>
            <Text style={styles.noteTimestamp}>{item.formattedCreatedAt}</Text>
          </View>
          <Text style={styles.noteContent}>{item.content}</Text>
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
    marginTop: 10,
  },
  noteMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  authorTag: {
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: "68%",
  },
  authorTagText: {
    color: "#065F46",
    fontSize: 12,
    fontWeight: "700",
  },
  noteTimestamp: {
    fontSize: 12,
    color: "#636363",
  },
});

function getNoteAuthorLabel(note: EmtNote, currentEmtId: string) {
  if (note.authorRole === "EMT") {
    if (note.authorId === currentEmtId) return "You";
    return `EMT - ${note.authorName ?? shortId(note.authorId)}`;
  }

  return `Dispatcher - ${note.authorName ?? shortId(note.authorId)}`;
}

function shortId(value: string) {
  return value.slice(0, 8);
}
