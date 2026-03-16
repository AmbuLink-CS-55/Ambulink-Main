import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/common/i18n/i18n";
import { LANGUAGES } from "@/common/constants/settings";
import { useSettings } from "@/common/hooks/SettingsContext";

export default function AppSettingsSection() {
  const { settings, setActiveModal, updateSetting } = useSettings();

  const getLanguageLabel = () => {
    return (
      LANGUAGES.find((lang) => lang.id === settings.language)?.label || i18n.t("languages.english")
    );
  };

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-foreground mb-3">
        {i18n.t("settings.appSettings.title")}
      </Text>

      <View className="bg-card rounded-2xl p-4">
        <Pressable
          className="flex-row justify-between items-center py-3"
          onPress={() => setActiveModal("language")}
        >
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1.5">
              {i18n.t("settings.appSettings.language")}
            </Text>
            <Text className="text-base text-foreground font-medium mt-1">{getLanguageLabel()}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#111827" />
        </Pressable>

        <View className="h-px bg-muted" />

        <View className="flex-row justify-between items-center py-3">
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1.5">
              {i18n.t("settings.appSettings.notifications")}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {settings.notifications ? i18n.t("common.enabled") : i18n.t("common.disabled")}
            </Text>
          </View>
          <Pressable
              className={`w-12 h-7 rounded-full justify-center p-0.5 ${
                settings.notifications ? "bg-brand" : "bg-muted"
              }`}
            onPress={() => updateSetting("notifications", !settings.notifications)}
          >
            <View
              className={`w-6 h-6 rounded-full bg-card ${
                settings.notifications ? "self-end" : "self-start"
              }`}
            />
          </Pressable>
        </View>

        <View className="h-px bg-muted" />

        <View className="flex-row justify-between items-center py-3">
          <View>
            <Text className="text-sm font-medium text-muted-foreground mb-1.5">
              {i18n.t("settings.appSettings.darkMode")}
            </Text>
            <Text className="text-sm text-muted-foreground mt-1">
              {settings.darkMode ? i18n.t("common.enabled") : i18n.t("common.disabled")}
            </Text>
          </View>
          <Pressable
              className={`w-12 h-7 rounded-full justify-center p-0.5 ${
                settings.darkMode ? "bg-brand" : "bg-muted"
              }`}
            onPress={() => updateSetting("darkMode", !settings.darkMode)}
          >
            <View
              className={`w-6 h-6 rounded-full bg-card ${settings.darkMode ? "self-end" : "self-start"}`}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
