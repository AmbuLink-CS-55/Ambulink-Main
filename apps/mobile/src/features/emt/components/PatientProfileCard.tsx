import type { BookingAssignedPayload } from "@ambulink/types";
import { Text, View } from "react-native";

type Props = {
  booking: BookingAssignedPayload;
};

export default function PatientProfileCard({ booking }: Props) {
  const profile = booking.patientProfileSnapshot;

  return (
    <View className="bg-card p-4 rounded-2xl border border-border">
      <Text className="text-xl font-bold text-foreground">Patient Details</Text>

      <View className="mt-4 gap-2">
        <Row label="Patient Name" value={booking.patient.fullName ?? profile?.profileName ?? "N/A"} />
        <Row label="Mobile" value={booking.patient.phoneNumber ?? profile?.profileMobile ?? "N/A"} />
        <Row label="Blood Type" value={profile?.bloodType ?? "N/A"} />
        <Row
          label="Allergies"
          value={profile?.selectedAllergies?.length ? profile.selectedAllergies.join(", ") : "N/A"}
        />
        <Row label="Language" value={profile?.language ?? "N/A"} />
        <Row label="Notifications" value={profile?.notifications ? "Enabled" : "Disabled"} />
        <Row label="Dark Mode" value={profile?.darkMode ? "Enabled" : "Disabled"} />

        <Text className="text-sm text-muted-foreground mt-2">Emergency Contacts</Text>
        {profile?.emergencyContacts?.length ? (
          profile.emergencyContacts.map((contact) => (
            <Text key={contact.id} className="text-sm text-foreground">
              {contact.name}: {contact.number}
            </Text>
          ))
        ) : (
          <Text className="text-sm text-muted-foreground">No emergency contacts available.</Text>
        )}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text className="text-xs text-muted-foreground">{label}</Text>
      <Text className="text-base text-foreground">{value}</Text>
    </View>
  );
}
