import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EmtNote } from "@ambulink/types";
import { FlatList, Linking, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { env } from "../../../../env";
import { AppImage } from "@/common/components/AppImage";
import { Audio, type AVPlaybackStatus } from "expo-av";

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
  const releaseSound = useCallback(async () => {
    const sound = soundRef.current;
    if (!sound) return;
    try {
      await sound.stopAsync();
    } catch {
      // ignore
    }
    try {
      await sound.setPositionAsync(0);
    } catch {
      // ignore
    }
    try {
      await sound.unloadAsync();
    } catch {
      // ignore
    }
    soundRef.current = null;
  }, []);

  const apiOrigin = env.EXPO_PUBLIC_API_SERVER_URL.replace(/\/api\/?$/, "");
  const toAttachmentUrl = (rawUrl: string) => {
    const absolute = rawUrl.startsWith("http://") || rawUrl.startsWith("https://");
    const base = absolute ? rawUrl : `${apiOrigin}${rawUrl}`;
    return `${base}?emtId=${currentEmtId}`;
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
    const handlePreviewChange = async () => {
      await releaseSound();
      setAudioPlaying(false);
      setAudioPositionMs(0);
      setAudioDurationMs(0);
      setAudioError(null);
    };
    void handlePreviewChange();
  }, [previewAudio?.url, releaseSound]);

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
      void releaseSound();
    };
  }, [releaseSound]);

  const onAudioStatus = (status: AVPlaybackStatus) => {
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

  const closeAudioModal = async () => {
    await releaseSound();
    setPreviewAudio(null);
    setAudioPlaying(false);
    setAudioPositionMs(0);
    setAudioDurationMs(0);
    setAudioError(null);
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
          <View className="py-6">
            <Text className="text-sm text-muted-foreground">
              No notes yet. Add the first update.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="mb-3 rounded-2xl border border-border bg-white p-4">
            <View className="flex-row items-center justify-between gap-2.5">
              <View className="max-w-[68%] rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1">
                <Text className="text-xs font-bold text-emerald-800">
                  {getNoteAuthorLabel(item, currentEmtId)}
                </Text>
              </View>
              <Text className="text-xs text-muted-foreground">{item.formattedCreatedAt}</Text>
            </View>
            <Text className="mt-2.5 leading-5 text-sm text-foreground">{item.content}</Text>
            {(item.attachments ?? []).length > 0 ? (
              <View className="mt-2.5 flex-col gap-1.5">
                {item.attachments?.map((attachment) =>
                  attachment.mimeType.startsWith("image/") ? (
                    <Pressable
                      key={attachment.id}
                      onPress={() => setPreviewImageUrl(toAttachmentUrl(attachment.url))}
                      className="overflow-hidden rounded-xl"
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
                      key={attachment.id}
                      className="min-h-[34px] rounded-xl border border-border bg-slate-50 items-center justify-center px-3"
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
                      <Text className="text-xs font-medium text-slate-900">
                        {attachment.kind} • {attachment.filename}
                      </Text>
                    </Pressable>
                  )
                )}
              </View>
            ) : null}
          </View>
        )}
      />
      <Modal visible={Boolean(previewImageUrl)} transparent animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/85 p-5">
          <Pressable
            className="absolute top-14 right-5 z-10 rounded-xl bg-white/95 px-3 py-2"
            onPress={() => setPreviewImageUrl(null)}
          >
            <Text className="font-bold text-gray-900">Close</Text>
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
        <Pressable
          className="flex-1 items-center justify-center bg-black/85 p-5"
          onPress={() => void closeAudioModal()}
        >
          <Pressable
            className="w-full rounded-2xl border border-border bg-white p-4 gap-2.5"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="text-lg font-bold text-foreground">Audio Attachment</Text>
            <Text className="text-sm text-slate-600">{previewAudio?.filename}</Text>
            <Text className="text-base font-semibold text-foreground">
              {formatMs(audioPositionMs)} / {formatMs(audioDurationMs)}
            </Text>
            {audioError ? (
              <Text className="text-xs font-semibold text-destructive">{audioError}</Text>
            ) : null}
            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 min-h-[40px] rounded-xl bg-indigo-100 items-center justify-center"
                onPress={() => void toggleAudioPlayback()}
                disabled={audioLoading}
              >
                <Text className="text-indigo-700 font-bold">
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
  imageThumb: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#E2E8F0",
  },
  previewImage: {
    width: "100%",
    height: "80%",
    borderRadius: 12,
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
