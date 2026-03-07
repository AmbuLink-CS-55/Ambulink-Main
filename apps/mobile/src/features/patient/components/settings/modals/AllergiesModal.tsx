import { Modal, View, Text, Pressable, FlatList, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/common/i18n/i18n";
import type { Allergie } from "@/common/constants/settings";

interface AllergiesModalProps {
  visible: boolean;
  onClose: () => void;
  selectedAllergies: string[];
  onAddAllergy: (allergy: Allergie) => void;
  onRemoveAllergy: (allergy: Allergie) => void;
  allergiesList: readonly Allergie[];
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-card rounded-t-2xl p-4 pb-8 max-h-[80%]">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-semibold text-foreground">
              {i18n.t("settings.medical.selectAllergies")}
            </Text>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close allergies modal"
            >
              <Ionicons name="close" size={24} color="#333" />
            </Pressable>
          </View>

          <TextInput
            className="border border-border rounded-xl p-3 text-sm mb-4"
            placeholder={i18n.t("settings.medical.searchAllergies")}
            value={allergiesSearch}
            onChangeText={setAllergiesSearch}
          />

          <FlatList
            data={filteredAllergies}
            renderItem={({ item }) => (
              <Pressable
                className="flex-row items-center py-3 px-4 border-b border-border"
                onPress={() =>
                  selectedAllergies.includes(item) ? onRemoveAllergy(item) : onAddAllergy(item)
                }
              >
                <View className="w-6 h-6 border-2 border-teal-500 rounded-md justify-center items-center mr-3">
                  {selectedAllergies.includes(item) && (
                    <Ionicons name="checkmark" size={16} color="#26A69A" />
                  )}
                </View>
                <Text className="text-base text-foreground flex-1">{item}</Text>
              </Pressable>
            )}
            keyExtractor={(item) => item}
            keyboardShouldPersistTaps="handled"
          />

          <Pressable
            className="bg-teal-500 rounded-full p-3.5 justify-center items-center mt-4"
            onPress={onClose}
          >
            <Text className="text-white text-base font-semibold">{i18n.t("common.done")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
