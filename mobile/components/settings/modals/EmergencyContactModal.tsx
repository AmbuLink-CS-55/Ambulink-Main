import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface EmergencyContactModalProps {
  visible: boolean;
  onClose: () => void;
  contactName: string;
  setContactName: (name: string) => void;
  emergencyContactNumber: string;
  setEmergencyContactNumber: (number: string) => void;
  isEditing: boolean;
  onSubmit: () => void;
}


export default function EmergencyContactModal({
  visible,
  onClose,
  contactName,
  setContactName,
  emergencyContactNumber,
  setEmergencyContactNumber,
  isEditing,
  onSubmit,
}: EmergencyContactModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Contact" : "Add Emergency Contact"}
            </Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contact Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Mom, Dad, Brother"
              value={contactName}
              onChangeText={setContactName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter phone number"
              value={emergencyContactNumber}
              onChangeText={setEmergencyContactNumber}
              keyboardType="phone-pad"
            />
          </View>

          <Pressable
            style={styles.modalConfirmButton}
            onPress={onSubmit}
          >
            <Text style={styles.modalConfirmButtonText}>
              {isEditing ? "Update" : "Add"}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: "#333",
  },
  modalConfirmButton: {
    backgroundColor: "#26A69A",
    borderRadius: 30,
    padding: 14,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  modalConfirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
