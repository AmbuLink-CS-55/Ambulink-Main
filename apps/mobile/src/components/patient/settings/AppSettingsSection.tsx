import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n/i18n";
import { LANGUAGES } from "@/constants/settings";
import { useSettings } from "@/contexts/SettingsContext";

export default function AppSettingsSection() {
  const { settings, setActiveModal, updateSetting } = useSettings();

  const getLanguageLabel = () => {
    return LANGUAGES.find((lang) => lang.id === settings.language)?.label || i18n.t("languages.english");
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-gray-800 mb-3">
        {i18n.t("settings.appSettings.title")}
      </Text>

      <View className="bg-white rounded-2xl p-4">
        <Pressable
          className="flex-row justify-between items-center py-3"
          onPress={() => setActiveModal("language")}
        >
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5">
              {i18n.t("settings.appSettings.language")}
            </Text>
            <Text className="text-base text-teal-500 font-medium mt-1">{getLanguageLabel()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#26A69A" />
        </Pressable>

        <View className="h-px bg-gray-200" />

        <View className="flex-row justify-between items-center py-3">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5">
              {i18n.t("settings.appSettings.notifications")}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              {settings.notifications ? i18n.t("common.enabled") : i18n.t("common.disabled")}
            </Text>
          </View>
          <Pressable
            className={`w-12 h-7 rounded-full justify-center p-0.5 ${
              settings.notifications ? "bg-teal-500" : "bg-gray-200"
            }`}
            onPress={() => updateSetting("notifications", !settings.notifications)}
          >
            <View
              className={`w-6 h-6 rounded-full bg-white ${
                settings.notifications ? "self-end" : "self-start"
              }`}
            />
          </Pressable>
        </View>

        <View className="h-px bg-gray-200" />

        <View className="flex-row justify-between items-center py-3">
          <View>
            <Text className="text-sm font-medium text-gray-600 mb-1.5">
              {i18n.t("settings.appSettings.darkMode")}
            </Text>
            <Text className="text-sm text-gray-400 mt-1">
              {settings.darkMode ? i18n.t("common.enabled") : i18n.t("common.disabled")}
            </Text>
          </View>
          <Pressable
            className={`w-12 h-7 rounded-full justify-center p-0.5 ${
              settings.darkMode ? "bg-teal-500" : "bg-gray-200"
            }`}
            onPress={() => updateSetting("darkMode", !settings.darkMode)}
          >
            <View
              className={`w-6 h-6 rounded-full bg-white ${settings.darkMode ? "self-end" : "self-start"}`}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
