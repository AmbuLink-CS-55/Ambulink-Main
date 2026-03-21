import { View, Text, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "@/common/i18n/i18n";
import { useSettings } from "@/common/hooks/SettingsContext";

export default function PersonalSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-foreground mb-3">
        {i18n.t("settings.personal.title")}
      </Text>

      <View className="bg-card rounded-2xl p-4">
        {/* Profile Picture Container */}
        <View className="self-center mb-5 relative">
          <View className="w-[100px] h-[100px] rounded-full bg-muted justify-center items-center">
            <MaterialCommunityIcons name="account-circle" size={60} color="#111827" />
          </View>
        </View>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-muted-foreground mb-1.5">
            {i18n.t("settings.personal.name")}
          </Text>
          <TextInput
            className="border border-border rounded-xl p-3 text-sm text-foreground"
            value={settings.profileName}
            onChangeText={(v) => updateSetting("profileName", v)}
            placeholder={i18n.t("settings.personal.enterName")}
          />
        </View>

        {/* Mobile Static View */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-muted-foreground mb-1.5">
            {i18n.t("home.mobile")}
          </Text>
          <TextInput
            className="border border-border rounded-xl p-3 text-sm text-foreground"
            keyboardType="numeric"
            value={settings.profileMobile}
            onChangeText={(v) => updateSetting("profileMobile", v)}
            placeholder={i18n.t("settings.personal.enterMobile")}
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-muted-foreground mb-1.5">
            {i18n.t("settings.personal.age")}
          </Text>
          <TextInput
            className="border border-border rounded-xl p-3 text-sm text-foreground"
            keyboardType="numeric"
            value={settings.age === null ? "" : String(settings.age)}
            onChangeText={(v) => {
              const digits = v.replace(/[^0-9]/g, "");
              updateSetting("age", digits === "" ? null : Number(digits));
            }}
            placeholder={i18n.t("settings.personal.enterAge")}
          />
        </View>

        {/* Email Static View */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-muted-foreground mb-1.5">
            {i18n.t("home.email")}
          </Text>
          <TextInput
            className="border border-border rounded-xl p-3 text-sm text-foreground"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={settings.email}
            onChangeText={(v) => updateSetting("email", v)}
            placeholder="Enter email"
          />
        </View>
      </View>
    </View>
  );
}
