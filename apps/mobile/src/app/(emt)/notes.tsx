import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EmtNoteComposer, EmtNotesTimeline } from "@/features/emt/components";
import { useEmtBookingState } from "@/features/emt/hooks/useEmtBookingState";

export default function EmtNotesScreen() {
  const booking = useEmtBookingState((state) => state.activeBooking);
  const submitNote = useEmtBookingState((state) => state.submitNote);

  const [draft, setDraft] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!booking) return;

    setSubmitting(true);
    const success = await submitNote(draft);
    setSubmitting(false);

    if (success) {
      setDraft("");
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16 }} keyboardShouldPersistTaps="handled">
        {!booking ? (
          <View className="bg-card p-4 rounded-2xl border border-border">
            <Text className="text-lg font-bold text-foreground">No Booking Selected</Text>
            <Text className="text-sm text-muted-foreground mt-2">
              Subscribe to a booking first, then you can add situation updates and notes.
            </Text>
          </View>
        ) : (
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Situation Notes</Text>
            <Text className="text-sm text-muted-foreground mt-1 mb-3">
              Booking {(booking.bookingId ?? "N/A").slice(0, 8)} • {booking.status}
            </Text>

            <View className="flex-1 min-h-72">
              <EmtNotesTimeline notes={booking.emtNotes ?? []} />
            </View>

            <EmtNoteComposer
              value={draft}
              onChange={setDraft}
              onSubmit={handleSubmit}
              loading={isSubmitting}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
