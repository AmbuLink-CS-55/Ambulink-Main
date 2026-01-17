import { Modal, View, Text, Pressable, FlatList, StyleSheet } from
  "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/src/languages/i18n";;

interface BloodTypeModalProps {
  visible: boolean;
  onClose: () => void;
  bloodType: string;
  setBloodType: (type: string) => void;
  bloodTypes: string[];
}


export default function BloodTypeModal({
  visible,
  onClose,
  bloodType,
  setBloodType,
  bloodTypes,
}: BloodTypeModalProps) {
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
            <Text style={styles.modalTitle}>{i18n.t("settings.medical.selectBloodType")}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <FlatList
            data={bloodTypes}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.modalOption,
                  bloodType === item &&
                  styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setBloodType(item);
                  onClose();
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    bloodType === item &&
                    styles.modalOptionTextSelected,
                  ]}
                >
                  {item}
                </Text>
                {bloodType === item && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#26A69A"
                  />
                )}
              </Pressable>
            )}
            keyExtractor={(item) => item}
            scrollEnabled={false}
          />
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
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalOptionSelected: {
    backgroundColor: "#E0F2F1",
  },
  modalOptionText: {
    fontSize: 16,
    color: "#333",
  },
  modalOptionTextSelected: {
    color: "#26A69A",
    fontWeight: "600",
  },
});
