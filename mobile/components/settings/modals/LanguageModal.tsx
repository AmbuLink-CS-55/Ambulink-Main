import { Modal, View, Text, Pressable, FlatList, StyleSheet } from
  "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Language {
  id: string;
  label: string;
  flag: string;
}

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  languages: Language[];
}


export default function LanguageModal({
  visible,
  onClose,
  language,
  setLanguage,
  languages,
}: LanguageModalProps) {
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
            <Text style={styles.modalTitle}>Select Language</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <FlatList
            data={languages}
            renderItem={({ item }) => (
              <Pressable
                style={[
                  styles.modalOption,
                  language === item.id &&
                  styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setLanguage(item.id);
                  onClose();
                }}
              >
                <View style={styles.languageOption}>
                  <Text style={styles.languageFlag}>{item.flag}</Text>
                  <Text
                    style={[
                      styles.modalOptionText,
                      language === item.id &&
                      styles.modalOptionTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </View>
                {language === item.id && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color="#26A69A"
                  />
                )}
              </Pressable>
            )}
            keyExtractor={(item) => item.id}
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
  languageOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  languageFlag: {
    fontSize: 24,
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
