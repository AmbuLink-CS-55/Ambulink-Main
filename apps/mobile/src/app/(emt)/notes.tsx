import { useMemo } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MediaNoteComposerCard from "@/common/components/MediaNoteComposerCard";
import EmtNotesTimeline from "@/features/emt/components/EmtNotesTimeline";
import { useEmtBookingState } from "@/features/emt/hooks/useEmtBookingState";
import { useMediaNoteComposer } from "@/common/hooks/useMediaNoteComposer";
import { createEmtMediaSubmitAdapter } from "@/common/lib/emtEvents";
import { env } from "../../../env";

export default function EmtNotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const booking = useEmtBookingState((state) => state.activeBooking);
  const submit = useMemo(() => {
    if (!booking?.bookingId) return null;
    return createEmtMediaSubmitAdapter({
      bookingId: booking.bookingId,
      emtId: env.EXPO_PUBLIC_EMT_ID,
    });
  }, [booking?.bookingId]);

  const { state, actions } = useMediaNoteComposer({
    submit: async (payload) => {
      if (!submit) {
        throw new Error("No active booking selected.");
      }
      await submit(payload);
      useEmtBookingState.getState().hydrateCurrentBooking();
    },
    maxFiles: 5,
  });

  const formatMs = (value: number) => {
    const total = Math.floor(value / 1000);
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right", "bottom"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
      >
        <View style={styles.screen}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          {!booking ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No Booking Selected</Text>
              <Text style={styles.emptySubtitle}>
                Subscribe to a booking first, then you can add situation updates and notes.
              </Text>
            </View>
          ) : (
            <View style={styles.bookingContainer}>
              <Text style={styles.title}>Situation Notes</Text>
              <Text style={styles.subtitle}>
                Booking {(booking.bookingId ?? "N/A").slice(0, 8)} • {booking.status}
              </Text>

              <View style={styles.timelineContainer}>
                <EmtNotesTimeline
                  notes={booking.emtNotes ?? []}
                  currentEmtId={env.EXPO_PUBLIC_EMT_ID}
                />
              </View>

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
                  recordingStatusText={`Recording audio... ${formatMs(state.recordingElapsedMs)}`}
                  loading={state.isSubmitting}
                  errorText={state.error}
                  copy={{
                    placeholder: "Type a situation update...",
                    cameraButtonLabel: "Camera",
                    audioStartLabel: "Audio",
                    audioStopLabel: "Stop Audio",
                    sendLabel: "Send",
                  }}
                />
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// uniwind was being weired
const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: "#FCFCFC",
  },
  screen: {
    flex: 1,
    padding: 16,
  },
  backButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#636363",
    marginTop: 8,
  },
  bookingContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#000000",
  },
  subtitle: {
    fontSize: 14,
    color: "#636363",
    marginTop: 4,
    marginBottom: 12,
  },
  timelineContainer: {
    flex: 1,
    minHeight: 0,
  },
});
