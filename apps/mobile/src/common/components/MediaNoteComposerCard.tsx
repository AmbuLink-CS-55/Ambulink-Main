import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import type { MediaAttachmentInput } from "@/common/lib/mediaNote";

type Copy = {
  placeholder?: string;
  mediaButtonLabel?: string;
  cameraButtonLabel?: string;
  audioStartLabel?: string;
  audioStopLabel?: string;
  sendLabel?: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onPickMedia?: () => void;
  onCaptureMedia?: () => void;
  onToggleAudio?: () => void;
  onRemoveAttachment?: (index: number) => void;
  files: MediaAttachmentInput[];
  isRecordingAudio?: boolean;
  recordingStatusText?: string;
  loading?: boolean;
  errorText?: string | null;
  copy?: Copy;
};

const formatAttachmentLabel = (file: MediaAttachmentInput) => {
  const type = file.type ?? "";
  if (type.startsWith("audio/")) {
    return `Audio - ${file.name ?? "recording"}`;
  }
  if (type.startsWith("video/")) {
    return `Video - ${file.name ?? "recording"}`;
  }
  return `Image - ${file.name ?? ""}`;
};

export default function MediaNoteComposerCard({
  value,
  onChange,
  onSubmit,
  onPickMedia,
  onCaptureMedia,
  onToggleAudio,
  onRemoveAttachment,
  files,
  isRecordingAudio = false,
  recordingStatusText,
  loading = false,
  errorText,
  copy,
}: Props) {
  return (
    <View style={styles.composer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={copy?.placeholder ?? "Type message..."}
        multiline
        maxLength={2000}
        textAlignVertical="top"
      />
      <View style={styles.actionRow}>
        {onPickMedia ? (
          <Pressable
            style={[styles.actionButton, loading ? styles.actionButtonDisabled : null]}
            onPress={onPickMedia}
            disabled={loading}
          >
            <Text style={styles.actionText}>{copy?.mediaButtonLabel ?? "Media"}</Text>
          </Pressable>
        ) : null}
        {onCaptureMedia ? (
          <Pressable
            style={[styles.actionButton, loading ? styles.actionButtonDisabled : null]}
            onPress={onCaptureMedia}
            disabled={loading}
          >
            <Text style={styles.actionText}>{copy?.cameraButtonLabel ?? "Camera"}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[
            styles.actionButton,
            isRecordingAudio ? styles.recordingButton : null,
            (loading || !onToggleAudio) && styles.actionButtonDisabled,
          ]}
          onPress={onToggleAudio}
          disabled={loading || !onToggleAudio}
        >
          <Text style={[styles.actionText, isRecordingAudio ? styles.recordingText : null]}>
            {isRecordingAudio
              ? (copy?.audioStopLabel ?? "Stop Audio")
              : (copy?.audioStartLabel ?? "Audio")}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sendButton, loading ? styles.sendButtonDisabled : null]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.sendText}>{copy?.sendLabel ?? "Send"}</Text>
          )}
        </Pressable>
      </View>

      {files.length > 0 ? (
        <View style={styles.pendingList}>
          {files.map((file, index) => (
            <View key={`${file.uri}-${index}`} style={styles.pendingItem}>
              <Text style={styles.pendingText} numberOfLines={1}>
                {formatAttachmentLabel(file)}
              </Text>
              {onRemoveAttachment ? (
                <Pressable onPress={() => onRemoveAttachment(index)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </View>
      ) : null}

      {isRecordingAudio && recordingStatusText ? (
        <View style={styles.recordingStatusRow}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingStatusText}>{recordingStatusText}</Text>
        </View>
      ) : null}

      {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  composer: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    backgroundColor: "#FCFCFC",
    paddingTop: 10,
    paddingBottom: 8,
    gap: 8,
  },
  input: {
    minHeight: 70,
    maxHeight: 120,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 10,
    backgroundColor: "#fff",
    textAlignVertical: "top",
  },
  actionRow: { flexDirection: "row", gap: 8 },
  actionButton: {
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  actionButtonDisabled: { opacity: 0.6 },
  actionText: { color: "#0F172A", fontWeight: "700" },
  recordingButton: { borderColor: "#DC2626", backgroundColor: "#FEE2E2" },
  recordingText: { color: "#991B1B" },
  sendButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendText: { color: "#fff", fontWeight: "700" },
  pendingList: {
    gap: 6,
    marginTop: 2,
  },
  pendingItem: {
    minHeight: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    flexDirection: "row",
    gap: 8,
  },
  pendingText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
  },
  removeText: {
    color: "#DC2626",
    fontWeight: "700",
    fontSize: 12,
  },
  recordingStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
    paddingHorizontal: 4,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: "#DC2626",
  },
  recordingStatusText: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "700",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 4,
  },
});
