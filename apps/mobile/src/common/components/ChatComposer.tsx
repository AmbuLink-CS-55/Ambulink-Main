import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onCameraPress?: () => void;
  onAudioPress?: () => void;
  isRecordingAudio?: boolean;
  loading?: boolean;
  placeholder?: string;
  maxLength?: number;
  attachmentLabels?: string[];
  attachmentSummaryText?: string;
  recordingStatusText?: string;
};

export default function ChatComposer({
  value,
  onChange,
  onSubmit,
  onCameraPress,
  onAudioPress,
  isRecordingAudio = false,
  loading = false,
  placeholder = "Type message...",
  maxLength = 2000,
  attachmentLabels = [],
  attachmentSummaryText,
  recordingStatusText,
}: Props) {
  const hasAttachmentLabels = attachmentLabels.length > 0;
  const showAttachmentSummary = !hasAttachmentLabels && Boolean(attachmentSummaryText);

  return (
    <View style={styles.composer}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline
        maxLength={maxLength}
        textAlignVertical="top"
      />
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.actionButton, (loading || !onCameraPress) && styles.actionButtonDisabled]}
          onPress={onCameraPress}
          disabled={loading || !onCameraPress}
        >
          <Text style={styles.actionText}>Camera</Text>
        </Pressable>
        <Pressable
          style={[
            styles.actionButton,
            isRecordingAudio ? styles.recordingButton : null,
            (loading || !onAudioPress) && styles.actionButtonDisabled,
          ]}
          onPress={onAudioPress}
          disabled={loading || !onAudioPress}
        >
          <Text style={[styles.actionText, isRecordingAudio ? styles.recordingText : null]}>
            {isRecordingAudio ? "Stop Audio" : "Audio"}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.sendButton, loading ? styles.sendButtonDisabled : null]}
          onPress={onSubmit}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Send</Text>}
        </Pressable>
      </View>
      {hasAttachmentLabels ? (
        <View style={styles.pendingList}>
          {attachmentLabels.map((label, index) => (
            <View key={`${label}-${index}`} style={styles.pendingItem}>
              <Text style={styles.pendingText} numberOfLines={1}>
                {label}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
      {showAttachmentSummary ? <Text style={styles.attachmentText}>{attachmentSummaryText}</Text> : null}
      {isRecordingAudio && recordingStatusText ? (
        <View style={styles.recordingStatusRow}>
          <View style={styles.recordingDot} />
          <Text style={styles.recordingStatusText}>{recordingStatusText}</Text>
        </View>
      ) : null}
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
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  pendingText: {
    color: "#0F172A",
    fontSize: 12,
    fontWeight: "600",
  },
  attachmentText: {
    marginTop: 6,
    color: "#475569",
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
});
