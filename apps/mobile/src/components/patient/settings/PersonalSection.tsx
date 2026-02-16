import { View, Text, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import i18n from "@/i18n/i18n";
import { useSettings } from "@/contexts/SettingsContext";

export default function PersonalSection() {
  const { settings, updateSetting } = useSettings();

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-[#333] mb-3">
        {i18n.t("settings.personal.title")}
      </Text>

      <View className="bg-white rounded-2xl p-4">
        {/* Profile Picture Container */}
        <View className="self-center mb-5 relative">
          <View className="w-[100px] h-[100px] rounded-full bg-[#F0F0F0] justify-center items-center">
            <MaterialCommunityIcons name="account-circle" size={60} color="#26A69A" />
          </View>
        </View>

        {/* Name Input */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-[#666] mb-1.5">
            {i18n.t("settings.personal.name")}
          </Text>
          <TextInput
            className="border border-[#E0E0E0] rounded-xl p-3 text-sm text-[#333]"
            value={settings.profileName}
            onChangeText={(v) => updateSetting("profileName", v)}
            placeholder={i18n.t("settings.personal.enterName")}
          />
        </View>

        {/* Mobile Static View */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-[#666] mb-1.5">{i18n.t("home.mobile")}</Text>
          <TextInput
            className="border border-[#E0E0E0] rounded-xl p-3 text-sm text-[#333]"
            keyboardType="numeric"
            value={settings.profileMobile}
            onChangeText={(v) => updateSetting("profileMobile", v)}
            placeholder={i18n.t("settings.personal.enterMobile")}
          />
        </View>

        {/* Email Static View */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-[#666] mb-1.5">{i18n.t("home.email")}</Text>
          <View className="border border-[#E0E0E0] rounded-xl p-3 bg-[#F8F8F8]">
            <Text className="text-sm text-[#666]"></Text>
          </View>
        </View>
      </View>
    </View>
  );
}
