import { Modal, View, Text, Pressable, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/common/i18n/i18n";

interface Language {
  id: string;
  label: string;
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
  const getLanguageLabel = (languageId: string) => {
    if (languageId === "si") return i18n.t("languages.sinhala");
    if (languageId === "ta") return i18n.t("languages.tamil");
    return i18n.t("languages.english");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-card rounded-t-2xl p-4 pb-8 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-foreground">
              {i18n.t("settings.appSettings.selectLanguage")}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close language modal"
            >
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <FlatList
            data={languages}
            renderItem={({ item }) => (
              <Pressable
                className={`flex-row justify-between items-center py-3 px-4 border-b border-border ${
                  language === item.id && "bg-teal-50"
                }`}
                onPress={() => {
                  setLanguage(item.id);
                  onClose();
                }}
              >
                <View className="flex-row items-center gap-3">
                  <Text
                    className={`text-base text-foreground ${
                      language === item.id && "text-teal-500 font-semibold"
                    }`}
                  >
                    {getLanguageLabel(item.id)}
                  </Text>
                </View>
                {language === item.id && <Ionicons name="checkmark" size={20} color="#26A69A" />}
              </Pressable>
            )}
            keyExtractor={(item) => item.id}
          />
        </View>
      </View>
    </Modal>
  );
}
