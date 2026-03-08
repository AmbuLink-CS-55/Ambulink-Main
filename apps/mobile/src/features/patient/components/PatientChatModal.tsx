import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
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

export default function PatientChatModal({ visible, onClose, notes, sending = false, onSend }: Props) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const slideProgress = useRef(new Animated.Value(1)).current;

  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const submit = useMemo(
    () => async (payload: { content?: string; files: { uri: string; name?: string; type?: string }[]; durationMs?: number }) => {
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
    () => [...notes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
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
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
          >
            <View style={styles.headerRow}>
              <Pressable
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Go back"
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={20} color="#111827" />
              </Pressable>
              <Text style={styles.title}>Chat</Text>
              <View style={styles.headerSpacer} />
            </View>

            <FlatList
              data={sortedNotes}
              keyExtractor={(item) => item.id}
              style={styles.timeline}
              contentContainerStyle={styles.timelineContent}
              ListEmptyComponent={<Text style={styles.emptyText}>No messages yet.</Text>}
              renderItem={({ item }) => (
                <View style={styles.noteCard}>
                  <View style={styles.noteMetaRow}>
                    <View style={styles.authorTag}>
                      <Text style={styles.authorTagText}>{getAuthorLabel(item)}</Text>
                    </View>
                    <Text style={styles.noteTimestamp}>{new Date(item.createdAt).toLocaleString()}</Text>
                  </View>
                  {item.content ? <Text style={styles.noteContent}>{item.content}</Text> : null}
                  {(item.attachments ?? []).map((attachment) => (
                    <View key={attachment.id} style={styles.attachmentWrap}>
                      {attachment.mimeType.startsWith("image/") ? (
                        <Pressable onPress={() => setPreviewImageUrl(toAttachmentUrl(attachment.url))}>
                          <AppImage
                            source={{ uri: toAttachmentUrl(attachment.url) }}
                            style={styles.imageThumb}
                            contentFit="cover"
                          />
                        </Pressable>
                      ) : (
                        <View style={styles.fileChip}>
                          <Text style={styles.fileLabel}>
                            {attachment.kind} • {attachment.filename}
                          </Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            />

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
          </KeyboardAvoidingView>
        </Animated.View>
      </Modal>

      <Modal visible={Boolean(previewImageUrl)} transparent animationType="fade">
        <Pressable style={styles.previewOverlay} onPress={() => setPreviewImageUrl(null)}>
          <Pressable style={styles.previewContent} onPress={(event) => event.stopPropagation()}>
            {previewImageUrl ? (
              <AppImage source={{ uri: previewImageUrl }} style={styles.previewImage} contentFit="contain" />
            ) : null}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: "#FCFCFC", paddingTop: 12, paddingHorizontal: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: { width: 40, height: 40 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827" },
  timeline: { flex: 1, marginTop: 12 },
  timelineContent: { paddingBottom: 12, gap: 8 },
  emptyText: { color: "#64748B" },
  noteCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginBottom: 10,
    gap: 8,
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
  noteContent: {
    fontSize: 14,
    color: "#000000",
    lineHeight: 20,
  },
  attachmentWrap: { gap: 6 },
  imageThumb: {
    width: "100%",
    height: 160,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#E2E8F0",
  },
  fileChip: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: "#F8FAFC",
  },
  fileLabel: { color: "#0F172A", fontSize: 12, fontWeight: "500" },
  previewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  previewContent: { width: "100%", height: "80%" },
  previewImage: { width: "100%", height: "100%", borderRadius: 12 },
});

function getAuthorLabel(note: BookingNote) {
  if (note.authorRole === "PATIENT") return "You";
  return note.authorRole;
}
