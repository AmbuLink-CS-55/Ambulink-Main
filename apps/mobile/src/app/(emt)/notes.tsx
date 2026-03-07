import { useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { EmtNoteComposer, EmtNotesTimeline } from "@/features/emt/components";
import { useEmtBookingState } from "@/features/emt/hooks/useEmtBookingState";
import { env } from "../../../env";

export default function EmtNotesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // TODO: test on ios
  insets.bottom = 0; // padding fix on android
  const booking = useEmtBookingState((state) => state.activeBooking);
  const submitNote = useEmtBookingState((state) => state.submitNote);

  const [draft, setDraft] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!booking || !draft.trim() || isSubmitting) return;

    setSubmitting(true);
    try {
      const success = await submitNote(draft.trim());
      if (success) {
        setDraft("");
      }
    } finally {
      setSubmitting(false);
    }
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
                <EmtNoteComposer
                  value={draft}
                  onChange={setDraft}
                  onSubmit={handleSubmit}
                  loading={isSubmitting}
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
