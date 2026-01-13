import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Contact {
  id: number;
  number: string;
  name: string;
}

interface EmergencyContactsSectionProps {
  emergencyContacts: Contact[];
  setEmergencyContactModal: (visible: boolean) => void;
  resetForm: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (id: number) => void;
}


export default function EmergencyContactsSection({
  emergencyContacts,
  setEmergencyContactModal,
  resetForm,
  onEdit,
  onDelete,
}: EmergencyContactsSectionProps) {
  return (
    <View style={styles.section}>
      <View style={styles.emergencyHeader}>
        <Text style={styles.sectionTitle}>Emergency Contacts</Text>
        <Pressable
          style={styles.addButton}
          onPress={() => {
            resetForm();
            setEmergencyContactModal(true);
          }}
        >
          <Ionicons name="add" size={20} color="white" />
        </Pressable>
      </View>

      <View style={styles.card}>
        {emergencyContacts.map((contact, index) => (
          <View key={contact.id}>
            <View style={styles.contactRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactNumber}>{contact.number}</Text>
              </View>
              <Pressable
                onPress={() => onEdit(contact)}
                style={styles.iconButton}
              >
                <Ionicons name="pencil" size={18} color="#26A69A" />
              </Pressable>
              <Pressable
                onPress={() => onDelete(contact.id)}
                style={styles.iconButton}
              >
                <Ionicons name="trash" size={18} color="#E74C3C" />
              </Pressable>
            </View>
            {index !== emergencyContacts.length - 1 && (
              <View style={styles.divider} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  emergencyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#26A69A",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  contactName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  contactNumber: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  iconButton: {
    padding: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
});
