import { useCallback } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { AppImage } from "@/common/components/AppImage";
import i18n from "@/common/i18n/i18n";
import { useSettings } from "@/common/hooks/SettingsContext";

export default function PersonalSection() {
  const { settings, updateSetting } = useSettings();

  const handlePickProfileImage = useCallback(async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        multiple: false,
        copyToCacheDirectory: true,
      });

      if (picked.canceled) return;

      const asset = picked.assets[0];
      if (asset?.uri) {
        updateSetting("profileImage", asset.uri);
      }
    } catch {
      Alert.alert(i18n.t("common.error"), i18n.t("settings.personal.pickProfileImageFailed"));
    }
  }, [updateSetting]);

  const handleRemoveProfileImage = useCallback(() => {
    Alert.alert(i18n.t("settings.personal.removeProfilePhoto"), i18n.t("settings.personal.confirmRemoveProfilePhoto"), [
      { text: i18n.t("common.cancel"), style: "cancel" },
      {
        text: i18n.t("common.delete"),
        style: "destructive",
        onPress: () => updateSetting("profileImage", null),
      },
    ]);
  }, [updateSetting]);

  return (
    <View className="mb-6">
      <Text className="text-lg font-semibold text-foreground mb-3">
        {i18n.t("settings.personal.title")}
      </Text>

      <View className="bg-card rounded-2xl p-4">
        {/* Profile Picture — pick image like medical documents (document picker + cache URI) */}
        <View className="self-center mb-5 relative">
          <Pressable
            onPress={() => void handlePickProfileImage()}
            accessibilityRole="button"
            accessibilityLabel={i18n.t("settings.personal.changeProfilePhoto")}
            className="w-[100px] h-[100px] rounded-full overflow-hidden bg-muted justify-center items-center border border-border"
          >
            {settings.profileImage ? (
              <AppImage
                source={{ uri: settings.profileImage }}
                style={{ width: "100%", height: "100%" }}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={60} color="#111827" />
            )}
          </Pressable>

          {settings.profileImage ? (
            <Pressable
              onPress={handleRemoveProfileImage}
              accessibilityRole="button"
              accessibilityLabel={i18n.t("settings.personal.removeProfilePhoto")}
              className="absolute top-0 left-0 w-9 h-9 rounded-full bg-red-500 justify-center items-center border-2 border-card"
            >
              <MaterialCommunityIcons name="trash-can-outline" size={18} color="white" />
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => void handlePickProfileImage()}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-teal-500 justify-center items-center border-2 border-card"
            accessibilityRole="button"
            accessibilityLabel={i18n.t("settings.personal.changeProfilePhoto")}
          >
            <MaterialCommunityIcons name="camera" size={18} color="white" />
          </Pressable>
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
            placeholder={i18n.t("settings.personal.enterEmail")}
          />
        </View>
      </View>
    </View>
  );
}
