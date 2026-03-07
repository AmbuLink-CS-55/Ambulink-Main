import type { BookingAssignedPayload } from "@ambulink/types";
import { Ionicons } from "@expo/vector-icons";
import { Alert, Linking, Pressable, Text, View } from "react-native";

type Props = {
  booking: BookingAssignedPayload;
};

export default function PatientProfileCard({ booking }: Props) {
  const profile = booking.patientProfileSnapshot;

  return (
    <View className="gap-4">
      <View className="bg-card p-4 rounded-2xl border border-border gap-4">
        <Text className="text-xl font-bold text-foreground">Booking Info</Text>

        <View className="gap-2">
          <Row label="Booking ID" value={booking.bookingId ?? "N/A"} />
          <Row label="Status" value={booking.status} />
        </View>

        <SectionTitle title="Timeline" />
        <View className="gap-2">
          <Row label="Requested" value={formatDateTime(booking.requestedAt)} />
          <Row label="Assigned" value={formatDateTime(booking.assignedAt)} />
          <Row label="Arrived" value={formatDateTime(booking.arrivedAt)} />
          <Row label="Picked Up" value={formatDateTime(booking.pickedupAt)} />
          <Row label="Completed" value={formatDateTime(booking.completedAt)} />
        </View>

        <SectionTitle title="Hospital & Provider" />
        <View className="gap-2">
          <Row label="Hospital" value={booking.hospital.name ?? "N/A"} />
          <ContactRow label="Hospital Phone" value={booking.hospital.phoneNumber ?? "N/A"} />
          <Row label="Hospital Location" value={formatPoint(booking.hospital.location)} />
          <Row label="Provider" value={booking.provider?.name ?? "N/A"} />
          <ContactRow label="Provider Hotline" value={booking.provider?.hotlineNumber ?? "N/A"} />
        </View>

        <SectionTitle title="Assigned Crew" />
        <View className="gap-2">
          <Row label="Driver Name" value={booking.driver.fullName ?? "N/A"} />
          <ContactRow label="Driver Mobile" value={booking.driver.phoneNumber ?? "N/A"} />
        </View>
      </View>

      <View className="bg-card p-4 pb-5 rounded-2xl border border-border gap-4">
        <Text className="text-xl font-bold text-foreground">Patient Info</Text>

        <View className="gap-2">
          <Row
            label="Patient Name"
            value={booking.patient.fullName ?? profile?.profileName ?? "N/A"}
          />
          <ContactRow
            label="Patient Mobile"
            value={booking.patient.phoneNumber ?? profile?.profileMobile ?? "N/A"}
          />
          <Row label="Patient Location" value={formatPoint(booking.patient.location)} />
        </View>

        <SectionTitle title="Patient Profile" />
        <View className="gap-2">
          <Row label="Blood Type" value={profile?.bloodType ?? "N/A"} />
          <Row
            label="Allergies"
            value={
              profile?.selectedAllergies?.length ? profile.selectedAllergies.join(", ") : "N/A"
            }
          />
          <Row label="Language" value={profile?.language ?? "N/A"} />
          <Row label="Notifications" value={profile?.notifications ? "Enabled" : "Disabled"} />
          <Row label="Dark Mode" value={profile?.darkMode ? "Enabled" : "Disabled"} />
        </View>

        <SectionTitle title="Emergency Contacts" />
        <View className="gap-2">
          {profile?.emergencyContacts?.length ? (
            profile.emergencyContacts.map((contact) => (
              <ContactRow key={contact.id} label={contact.name} value={contact.number} />
            ))
          ) : (
            <Text className="text-sm text-muted-foreground">No emergency contacts available.</Text>
          )}
        </View>
      </View>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <Text className="text-sm font-semibold text-muted-foreground uppercase">{title}</Text>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-base text-foreground">{value}</Text>
    </View>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  const sanitizedNumber = sanitizePhone(value);
  const canCall = Boolean(sanitizedNumber);

  const handleCall = async () => {
    if (!sanitizedNumber) return;
    const telUrl = `tel:${sanitizedNumber}`;
    const supported = await Linking.canOpenURL(telUrl);
    if (!supported) {
      Alert.alert("Call unavailable", "This device cannot place phone calls.");
      return;
    }
    await Linking.openURL(telUrl);
  };

  return (
    <View className="flex-row items-end justify-between gap-3">
      <View className="flex-1">
        <Text className="text-xs text-muted-foreground">{label}</Text>
        <Text className="text-base text-foreground">{value}</Text>
      </View>
      <Pressable
        onPress={() => void handleCall()}
        disabled={!canCall}
        accessibilityRole="button"
        accessibilityLabel={`Call ${label}`}
        className={`h-10 w-10 rounded-full items-center justify-center border ${
          canCall ? "bg-emerald-500 border-emerald-600" : "bg-muted border-border"
        }`}
      >
        <Ionicons name="call" size={16} color={canCall ? "#FFFFFF" : "#9CA3AF"} />
      </Pressable>
    </View>
  );
}

function formatDateTime(value?: string | null) {
  if (!value) return "N/A";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatPoint(
  point?: {
    x: number;
    y: number;
  } | null
) {
  if (!point) return "N/A";
  return `${point.y.toFixed(5)}, ${point.x.toFixed(5)}`;
}

function sanitizePhone(value: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.toLowerCase() === "n/a") return null;
  const normalized = trimmed.replace(/[^\d+]/g, "");
  return normalized.length > 0 ? normalized : null;
}
