import React, { useEffect, useMemo } from "react";
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  startPatientUploadSession,
  submitPatientMediaNote,
} from "@/common/lib/patientEvents";
import MediaNoteComposerCard from "@/common/components/MediaNoteComposerCard";
import { useMediaNoteComposer } from "@/common/hooks/useMediaNoteComposer";
import type { MediaNoteSubmitPayload } from "@/common/lib/mediaNote";

type Props = {
  visible: boolean;
  onClose: () => void;
  bookingId?: string | null;
  sessionId?: string | null;
  onSessionReady: (sessionId: string) => void;
};

export default function PatientUploadComposer({
  visible,
  onClose,
  bookingId,
  sessionId,
  onSessionReady,
}: Props) {
  const submitAdapter = useMemo(() => {
    return async (payload: MediaNoteSubmitPayload) => {
      let effectiveSessionId = sessionId ?? undefined;

      if (!bookingId && !effectiveSessionId) {
        const created = await startPatientUploadSession();
        effectiveSessionId = created.uploadSessionId;
        onSessionReady(effectiveSessionId);
      }

      await submitPatientMediaNote({
        bookingId: bookingId ?? undefined,
        sessionId: effectiveSessionId,
        content: payload.content,
        durationMs: payload.durationMs,
        files: payload.files,
      });
    };
  }, [bookingId, onSessionReady, sessionId]);

  const { state, actions } = useMediaNoteComposer({ submit: submitAdapter, maxFiles: 5 });
  const { dispose } = actions;

  useEffect(() => {
    if (visible) return;
    void dispose();
  }, [dispose, visible]);

  const onSubmit = async () => {
    const success = await actions.submit();
    if (success) {
      Alert.alert("Uploaded", "Your update is shared with EMT and dispatch team.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Upload Updates</Text>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>Close</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <MediaNoteComposerCard
            value={state.text}
            onChange={actions.setText}
            onSubmit={() => void onSubmit()}
            onPickMedia={() => void actions.pickMedia()}
            onCaptureMedia={() => void actions.captureMedia()}
            onToggleAudio={() => void actions.toggleRecording()}
            onRemoveAttachment={actions.removeFile}
            files={state.files}
            isRecordingAudio={state.isRecordingAudio}
            loading={state.isSubmitting}
            recordingStatusText={`Recording audio... ${formatMs(state.recordingElapsedMs)}`}
            errorText={state.error}
            copy={{
              placeholder: "Add note (optional)",
              mediaButtonLabel: "Library",
              cameraButtonLabel: "Camera",
              audioStartLabel: "Record Voice",
              audioStopLabel: "Stop Recording",
              sendLabel: "Send Update",
            }}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

const formatMs = (value: number) => {
  const total = Math.floor(value / 1000);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 18,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
  },
  closeText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  body: {
    paddingBottom: 24,
  },
});
