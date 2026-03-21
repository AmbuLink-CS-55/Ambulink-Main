import { useCallback } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import i18n from "@/common/i18n/i18n";
import { useSettings } from "@/common/hooks/SettingsContext";

const bytesToLabel = (size: number | null) => {
  if (!size || size <= 0) return null;
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

export default function MedicalSection() {
  const { settings, setActiveModal, updateSetting, handleDeleteMedicalDocument } = useSettings();

  const handlePickDocuments = useCallback(async () => {
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (picked.canceled) return;

      const nextDocuments = [...settings.medicalDocuments];
      for (const asset of picked.assets) {
        const existingIndex = nextDocuments.findIndex((doc) => doc.uri === asset.uri);
        const doc = {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType ?? null,
          size: asset.size ?? null,
        };

        if (existingIndex >= 0) {
          nextDocuments[existingIndex] = doc;
        } else {
          nextDocuments.push(doc);
        }
      }

      updateSetting("medicalDocuments", nextDocuments);
    } catch {
      Alert.alert(i18n.t("common.error"), "Failed to pick documents");
    }
  }, [settings.medicalDocuments, updateSetting]);

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

        <View>
          <Pressable
            className="flex-row justify-between items-center py-3"
            onPress={() => void handlePickDocuments()}
          >
            <View className="flex-1">
              <Text className="text-sm font-medium text-muted-foreground mb-1.5">
                {i18n.t("settings.medical.medicalDocuments")}
              </Text>
              <Text className="text-sm text-muted-foreground mt-1">
                {i18n.t("settings.medical.uploadDocuments")}
              </Text>
            </View>
            <Ionicons name="document-attach-outline" size={20} color="#111827" />
          </Pressable>

          {settings.medicalDocuments.length > 0 ? (
            <View className="mt-3 gap-2">
              {settings.medicalDocuments.map((doc) => (
                <View
                  key={doc.uri}
                  className="rounded-lg bg-surface px-3 py-2 flex-row justify-between items-start gap-3"
                >
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      {bytesToLabel(doc.size) ?? doc.mimeType ?? "Document"}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleDeleteMedicalDocument(doc.uri)}
                    className="p-2"
                    accessibilityRole="button"
                    accessibilityLabel={`Remove document ${doc.name}`}
                  >
                    <Ionicons name="trash" size={18} color="#E74C3C" />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
