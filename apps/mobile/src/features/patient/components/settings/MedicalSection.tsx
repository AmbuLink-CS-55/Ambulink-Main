import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/common/i18n/i18n";
import { useSettings } from "@/common/hooks/SettingsContext";

export default function MedicalSection() {
  const { settings, setActiveModal } = useSettings();

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-foreground mb-3">
        {i18n.t("settings.medical.title")}
      </Text>

      <View className="bg-card rounded-2xl p-4">
        <Pressable
          className="flex-row justify-between items-center py-3"
          onPress={() => setActiveModal("bloodType")}
        >
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1.5">
              {i18n.t("settings.medical.bloodType")}
            </Text>
            <Text className="text-base text-foreground font-medium mt-1">{settings.bloodType}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#111827" />
        </Pressable>

        <View className="h-px bg-muted" />

        <Pressable
          className="flex-row justify-between items-center py-3"
          onPress={() => setActiveModal("allergies")}
        >
          <View className="flex-1">
            <Text className="text-sm font-medium text-muted-foreground mb-1.5">
              {i18n.t("settings.medical.allergies")}
            </Text>
            {settings.selectedAllergies.length > 0 ? (
              <View className="flex-row flex-wrap gap-2 mt-2">
                {settings.selectedAllergies.map((allergy) => (
                  <View
                    key={allergy}
                    className="flex-row items-center bg-surface rounded-full pl-3 pr-1.5 py-1.5 gap-1.5"
                  >
                    <Text className="text-xs text-foreground font-medium">{allergy}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text className="text-sm text-muted-foreground mt-1">
                {i18n.t("settings.medical.addAllergies")}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color="#111827" />
        </Pressable>

        <View className="h-px bg-muted" />

        <Pressable className="flex-row justify-between items-center py-3">
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1.5">
              {i18n.t("settings.medical.medicalDocuments")}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {i18n.t("settings.medical.uploadDocuments")}
            </Text>
          </View>
          <Ionicons name="document-attach-outline" size={20} color="#111827" />
        </Pressable>
      </View>
    </View>
  );
}
