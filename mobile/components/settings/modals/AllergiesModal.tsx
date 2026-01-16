import {
  Modal,
  View,
  Text,
  Pressable,
  FlatList,
  TextInput,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/languages/i18n";

interface AllergiesModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAllergies: string[];
  onAddAllergy: (allergy: string) => void;
  onRemoveAllergy: (allergy: string) => void;
  allergiesList: string[];
  allergiesSearch: string;
  setAllergiesSearch: (search: string) => void;
}

export default function AllergiesModal({
  visible,
  onClose,
  selectedAllergies,
  onAddAllergy,
  onRemoveAllergy,
  allergiesList,
  allergiesSearch,
  setAllergiesSearch,
}: AllergiesModalProps) {
  const filteredAllergies = allergiesList.filter((allergy) =>
    allergy.toLowerCase().includes(allergiesSearch.toLowerCase())
  );

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
            <Text style={styles.modalTitle}>{i18n.t("settings.medical.selectAllergies")}</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder={i18n.t("settings.medical.searchAllergies")}
            value={allergiesSearch}
            onChangeText={setAllergiesSearch}
          />

          <FlatList
            data={filteredAllergies}
            renderItem={({ item }) => (
              <Pressable
                style={styles.allergyOption}
                onPress={() =>
                  selectedAllergies.includes(item)
                    ? onRemoveAllergy(item)
                    : onAddAllergy(item)
                }
              >
                <View style={styles.checkbox}>
                  {selectedAllergies.includes(item) && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color="#26A69A"
                    />
                  )}
                </View>
                <Text style={styles.allergyOptionText}>{item}</Text>
              </Pressable>
            )}
            keyExtractor={(item) => item}
            scrollEnabled={false}
          />

          <Pressable
            style={styles.modalConfirmButton}
            onPress={onClose}
          >
            <Text style={styles.modalConfirmButtonText}>{i18n.t("common.done")}</Text>
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
  searchInput: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  allergyOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#26A69A",
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  allergyOptionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
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
