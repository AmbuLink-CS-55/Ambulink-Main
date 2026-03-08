import { useEffect, useMemo, useRef, useState } from "react";
import type { EmtNote } from "@ambulink/types";
import { FlatList, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { env } from "../../../../env";
import { AppImage } from "@/common/components";
import { Audio } from "expo-av";

type Props = {
  notes: EmtNote[];
  currentEmtId: string;
};

export default function EmtNotesTimeline({ notes, currentEmtId }: Props) {
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<{ url: string; filename: string } | null>(null);
  const [isAudioPlaying, setAudioPlaying] = useState(false);
  const [audioPositionMs, setAudioPositionMs] = useState(0);
  const [audioDurationMs, setAudioDurationMs] = useState(0);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  const apiOrigin = env.EXPO_PUBLIC_API_SERVER_URL.replace(/\/api\/?$/, "");
  const toAttachmentUrl = (rawUrl: string) => {
    const absolute = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
    const base = absolute ? rawUrl : `${apiOrigin}${rawUrl}`;
    return `${base}?emtId=${env.EXPO_PUBLIC_EMT_ID}`;
  };
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

  useEffect(() => {
    const release = async () => {
      if (!soundRef.current) return;
      try {
        await soundRef.current.unloadAsync();
      } finally {
        soundRef.current = null;
      }
    };
    void release();
    setAudioPlaying(false);
    setAudioPositionMs(0);
    setAudioDurationMs(0);
    setAudioError(null);
  }, [previewAudio?.url]);

  useEffect(() => {
    if (!previewAudio) return;
    const autoPlay = async () => {
      setAudioLoading(true);
      setAudioError(null);
      try {
        const created = await Audio.Sound.createAsync(
          { uri: previewAudio.url },
          { shouldPlay: true },
          onAudioStatus
        );
        soundRef.current = created.sound;
      } catch (error) {
        setAudioError(error instanceof Error ? error.message : "Failed to play audio");
      } finally {
        setAudioLoading(false);
      }
    };
    void autoPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewAudio?.url]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        void soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    };
  }, []);

  const onAudioStatus = (status: Audio.AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setAudioPlaying(status.isPlaying);
    setAudioPositionMs(status.positionMillis ?? 0);
    setAudioDurationMs(status.durationMillis ?? 0);
  };

  const toggleAudioPlayback = async () => {
    if (!previewAudio) return;
    setAudioLoading(true);
    setAudioError(null);
    try {
      if (!soundRef.current) {
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
      } else {
        await soundRef.current.playAsync();
      }
    } catch (error) {
      setAudioError(error instanceof Error ? error.message : "Failed to play audio");
    } finally {
      setAudioLoading(false);
    }
  };

  const stopAudioPlayback = async () => {
    if (!soundRef.current) return;
    try {
      await soundRef.current.stopAsync();
      await soundRef.current.setPositionAsync(0);
    } catch {
      // ignore playback stop errors
    }
  };

  const closeAudioModal = async () => {
    await stopAudioPlayback();
    setPreviewAudio(null);
  };

  const formatMs = (value: number) => {
    const seconds = Math.floor(value / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <>
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
            {(item.attachments ?? []).length > 0 ? (
              <View style={styles.attachments}>
                {item.attachments?.map((attachment) => (
                  <View key={attachment.id} style={styles.attachmentWrap}>
                    {attachment.mimeType.startsWith("image/") ? (
                      <Pressable
                        onPress={() => setPreviewImageUrl(toAttachmentUrl(attachment.url))}
                      >
                        <AppImage
                          source={{
                            uri: toAttachmentUrl(attachment.url),
                          }}
                          style={styles.imageThumb}
                          contentFit="cover"
                        />
                      </Pressable>
                    ) : (
                      <Pressable
                        style={styles.attachmentChip}
                        onPress={() => {
                          if (attachment.mimeType.startsWith("audio/")) {
                            setPreviewAudio({
                              url: toAttachmentUrl(attachment.url),
                              filename: attachment.filename,
                            });
                            return;
                          }
                          Linking.openURL(toAttachmentUrl(attachment.url));
                        }}
                      >
                        <Text style={styles.attachmentText}>
                          {attachment.kind} • {attachment.filename}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
      />
      <Modal visible={Boolean(previewImageUrl)} transparent animationType="fade">
        <View style={styles.previewOverlay}>
          <Pressable style={styles.previewClose} onPress={() => setPreviewImageUrl(null)}>
            <Text style={styles.previewCloseText}>Close</Text>
          </Pressable>
          {previewImageUrl ? (
            <AppImage
              source={{ uri: previewImageUrl }}
              style={styles.previewImage}
              contentFit="contain"
            />
          ) : null}
        </View>
      </Modal>
      <Modal visible={Boolean(previewAudio)} transparent animationType="fade">
        <Pressable style={styles.previewOverlay} onPress={() => void closeAudioModal()}>
          <Pressable style={styles.audioCard} onPress={(event) => event.stopPropagation()}>
            <Text style={styles.audioTitle}>Audio Attachment</Text>
            <Text style={styles.audioFileName}>{previewAudio?.filename}</Text>
            <Text style={styles.audioTime}>
              {formatMs(audioPositionMs)} / {formatMs(audioDurationMs)}
            </Text>
            {audioError ? <Text style={styles.audioError}>{audioError}</Text> : null}
            <View style={styles.audioActions}>
              <Pressable
                style={styles.audioActionButton}
                onPress={() => void toggleAudioPlayback()}
                disabled={audioLoading}
              >
                <Text style={styles.audioActionText}>
                  {audioLoading ? "Loading..." : isAudioPlaying ? "Pause" : "Play"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
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
  attachments: {
    marginTop: 10,
    gap: 6,
  },
  attachmentWrap: {
    gap: 6,
  },
  imageThumb: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#E2E8F0",
  },
  attachmentChip: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#F8FAFC",
  },
  attachmentText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "500",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  previewImage: {
    width: "100%",
    height: "80%",
    borderRadius: 12,
  },
  previewClose: {
    position: "absolute",
    top: 54,
    right: 20,
    zIndex: 3,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  previewCloseText: {
    color: "#111827",
    fontWeight: "700",
  },
  audioCard: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 16,
    gap: 10,
  },
  audioTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111827",
  },
  audioFileName: {
    color: "#334155",
    fontSize: 13,
  },
  audioTime: {
    color: "#0F172A",
    fontWeight: "600",
  },
  audioError: {
    color: "#DC2626",
    fontSize: 12,
  },
  audioActions: {
    flexDirection: "row",
    gap: 8,
  },
  audioActionButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  audioActionText: {
    color: "#3730A3",
    fontWeight: "700",
  },
});

function getNoteAuthorLabel(note: EmtNote, currentEmtId: string) {
  if (note.authorRole === "EMT") {
    if (note.authorId === currentEmtId) return "You";
    return `EMT - ${note.authorName ?? shortId(note.authorId)}`;
  }
  if (note.authorRole === "PATIENT") {
    return `Patient - ${note.authorName ?? shortId(note.authorId)}`;
  }

  return `Dispatcher - ${note.authorName ?? shortId(note.authorId)}`;
}

function shortId(value: string) {
  return value.slice(0, 8);
}
