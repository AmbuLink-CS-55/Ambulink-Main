import { Ionicons } from "@expo/vector-icons";
import { Audio, type AVPlaybackStatus } from "expo-av";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppImage } from "@/common/components/AppImage";
import MediaNoteComposerCard from "@/common/components/MediaNoteComposerCard";
import { useMediaNoteComposer } from "@/common/hooks/useMediaNoteComposer";
import { env } from "../../../../env";
import type { BookingNote } from "@ambulink/types";

type Props = {
  visible: boolean;
  onClose: () => void;
  notes: BookingNote[];
  sending?: boolean;
  onSend: (params: {
    content?: string;
    files: { uri: string; name?: string; type?: string }[];
    durationMs?: number;
  }) => Promise<void>;
};

export default function PatientChatModal({
  visible,
  onClose,
  notes,
  sending = false,
  onSend,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const slideProgress = useRef(new Animated.Value(1)).current;

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
  const submit = useMemo(
    () =>
      async (payload: {
        content?: string;
        files: { uri: string; name?: string; type?: string }[];
        durationMs?: number;
      }) => {
        await onSend({
          content: payload.content,
          files: payload.files.map((file) => ({
            uri: file.uri,
            name: file.name ?? `patient-media-${Date.now()}`,
            type: file.type ?? "application/octet-stream",
          })),
          durationMs: payload.durationMs,
        });
      },
    [onSend]
  );

  const { state, actions } = useMediaNoteComposer({
    submit,
    maxFiles: 5,
  });
  const { dispose } = actions;

  const sortedNotes = useMemo(
    () =>
      [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [notes]
  );

  useEffect(() => {
    if (!visible) return;
    slideProgress.setValue(1);
    Animated.timing(slideProgress, {
      toValue: 0,
      duration: 240,
      useNativeDriver: true,
    }).start();
  }, [slideProgress, visible]);

  const apiOrigin = env.EXPO_PUBLIC_API_SERVER_URL.replace(/\/api\/?$/, "");
  const toAttachmentUrl = (url: string) => {
    const absolute = url.startsWith("http://") || url.startsWith("https://");
    return `${absolute ? url : `${apiOrigin}${url}`}?patientId=${env.EXPO_PUBLIC_PATIENT_ID}`;
  };
  const onAudioStatus = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setAudioPlaying(status.isPlaying);
    setAudioPositionMs(status.positionMillis ?? 0);
    setAudioDurationMs(status.durationMillis ?? 0);
  };

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

  useEffect(() => {
    if (visible) return;
    void dispose();
  }, [dispose, visible]);

  const formatMs = (value: number) => {
    const total = Math.floor(value / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  const handleClose = () => {
    Animated.timing(slideProgress, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(() => onClose());
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

  return (
    <>
      <Modal visible={visible} animationType="none" onRequestClose={handleClose}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [
                {
                  translateX: slideProgress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width],
                  }),
                },
              ],
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
          >
            <View className="flex-row items-center justify-between mb-2">
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                className="h-10 w-10 rounded-full bg-white border border-[#E5E5E5] items-center justify-center"
              >
                <Ionicons name="arrow-back" size={20} color="#111827" />
              </Pressable>
              <Text className="text-[22px] font-bold text-foreground">Chat</Text>
              <View className="w-10 h-10" />
            </View>

            <FlatList
              data={sortedNotes}
              keyExtractor={(item) => item.id}
              className="flex-1 mt-3"
              contentContainerStyle={{ paddingBottom: 12 }}
              maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
              keyboardDismissMode="on-drag"
              ListEmptyComponent={
                <Text className="p-3 text-sm text-muted-foreground">No messages yet.</Text>
              }
              renderItem={({ item }) => (
                <View className="w-full rounded-2xl border border-border bg-card p-4 mb-3 gap-2">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 max-w-[68%]">
                      <Text className="text-xs font-bold text-emerald-700">
                        {getAuthorLabel(item)}
                      </Text>
                    </View>
                    <Text className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                  {item.content ? (
                    <Text className="text-base text-foreground leading-6">{item.content}</Text>
                  ) : null}
                  {(item.attachments ?? []).map((attachment) => (
                    <View key={attachment.id} className="mb-2">
                      {attachment.mimeType.startsWith("image/") ? (
                        <Pressable
                          onPress={() => setPreviewImageUrl(toAttachmentUrl(attachment.url))}
                        >
                          <AppImage
                            source={{ uri: toAttachmentUrl(attachment.url) }}
                            style={styles.imageThumb}
                            contentFit="cover"
                          />
                        </Pressable>
                      ) : attachment.mimeType.startsWith("audio/") ? (
                        <Pressable
                          className="min-h-[34px] rounded-xl border border-slate-300 bg-slate-100 justify-center px-3"
                          onPress={() => {
                            setPreviewAudio({
                              url: toAttachmentUrl(attachment.url),
                              filename: attachment.filename,
                            });
                          }}
                        >
                          <Text className="text-[12px] font-semibold text-foreground">
                            {attachment.kind} • {attachment.filename}
                          </Text>
                        </Pressable>
                      ) : (
                        <Pressable
                          className="min-h-[34px] rounded-xl border border-slate-300 bg-slate-100 justify-center px-3"
                          onPress={() => void Linking.openURL(toAttachmentUrl(attachment.url))}
                        >
                          <Text className="text-[12px] font-semibold text-foreground">
                            {attachment.kind} • {attachment.filename}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  ))}
                </View>
              )}
            />

            <View style={{ paddingBottom: Math.max(insets.bottom, 8) }}>
              <MediaNoteComposerCard
                value={state.text}
                onChange={actions.setText}
                onSubmit={() => void actions.submit()}
                onCaptureMedia={() => void actions.captureMedia()}
                onToggleAudio={() => void actions.toggleRecording()}
                onRemoveAttachment={actions.removeFile}
                files={state.files}
                isRecordingAudio={state.isRecordingAudio}
                loading={sending || state.isSubmitting}
                recordingStatusText={`Recording audio... ${formatMs(state.recordingElapsedMs)}`}
                errorText={state.error}
                copy={{
                  placeholder: "Type message...",
                  cameraButtonLabel: "Camera",
                  audioStartLabel: "Audio",
                  audioStopLabel: "Stop Audio",
                  sendLabel: "Send",
                }}
              />
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      <Modal visible={Boolean(previewImageUrl)} transparent animationType="fade">
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewImageUrl(null)}>
          <Pressable style={styles.previewContent} onPress={(event) => event.stopPropagation()}>
            {previewImageUrl ? (
              <AppImage
                source={{ uri: previewImageUrl }}
                style={styles.previewImage}
                contentFit="contain"
              />
            ) : null}
          </Pressable>
        </Pressable>
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
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#FCFCFC", paddingTop: 12, paddingHorizontal: 16 },
  imageThumb: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#E2E8F0",
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  previewContent: { width: "100%", height: "80%" },
  previewImage: { width: "100%", height: "100%", borderRadius: 12 },
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

function getAuthorLabel(note: BookingNote) {
  if (note.authorRole === "PATIENT") return "You";
  return note.authorRole;
}
