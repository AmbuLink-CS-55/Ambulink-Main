import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n/i18n";

interface MedicalSectionProps {
  bloodType: string;
  setBloodTypeModal: (visible: boolean) => void;
  selectedAllergies: string[];
  setAllergiesModal: (visible: boolean) => void;
}

export default function MedicalSection({
  bloodType,
  setBloodTypeModal,
  selectedAllergies,
  setAllergiesModal,
}: MedicalSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">
        {i18n.t("settings.medical.title")}
      </Text>

      <View className="bg-white rounded-2xl p-4">
        <Pressable
          className="flex-row justify-between items-center py-3"
          onPress={() => setBloodTypeModal(true)}
        >
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5">
              {i18n.t("settings.medical.bloodType")}
            </Text>
            <Text className="text-base text-teal-500 font-medium mt-1">{bloodType}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#26A69A" />
        </Pressable>

        <View className="h-px bg-gray-200" />

        <Pressable
          className="flex-row justify-between items-center py-3"
          onPress={() => setAllergiesModal(true)}
        >
          <View className="flex-1">
            <Text className="text-sm font-medium text-gray-600 mb-1.5">
              {i18n.t("settings.medical.allergies")}
            </Text>
            {selectedAllergies.length > 0 ? (
              <View className="flex-row flex-wrap gap-2 mt-2">
                {selectedAllergies.map((allergy) => (
                  <View
                    key={allergy}
                    className="flex-row items-center bg-teal-50 rounded-full pl-3 pr-1.5 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs text-teal-500 font-medium">{allergy}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-gray-400 mt-1">
                {i18n.t("settings.medical.addAllergies")}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#26A69A" />
        </Pressable>

        <View className="h-px bg-gray-200" />

        <Pressable className="flex-row justify-between items-center py-3">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5">
              {i18n.t("settings.medical.medicalDocuments")}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              {i18n.t("settings.medical.uploadDocuments")}
            </Text>
          </View>
          <Ionicons name="document-attach-outline" size={20} color="#26A69A" />
        </Pressable>
      </View>
    </View>
  );
}
