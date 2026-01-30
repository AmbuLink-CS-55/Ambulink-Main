import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import i18n from "@/i18n/i18n";

interface AppSettingsSectionProps {
  language: string;
  setLanguageModal: (visible: boolean) => void;
  notifications: boolean;
  setNotifications: (value: boolean) => void;
  darkMode: boolean;
  setDarkMode: (value: boolean) => void;
}

const LANGUAGES = [
  { id: "en", label: i18n.t("languages.english") },
  { id: "si", label: i18n.t("languages.sinhala") },
  { id: "ta", label: i18n.t("languages.tamil") },
];

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
  },
  selectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginBottom: 6,
  },
  selectedValue: {
    fontSize: 16,
    color: "#26A69A",
    fontWeight: "500",
    marginTop: 4,
  },
  placeholderText: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: "#E0E0E0",
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#E0E0E0",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: "#26A69A",
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  toggleThumbActive: {
    alignSelf: "flex-end",
  },
});

export default function AppSettingsSection({
  language,
  setLanguageModal,
  notifications,
  setNotifications,
  darkMode,
  setDarkMode,
}: AppSettingsSectionProps) {
  const getLanguageLabel = () => {
    return LANGUAGES.find((lang) => lang.id === language)?.label ||
      i18n.t("languages.english");
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{i18n.t("settings.appSettings.title")}</Text>

      <View style={styles.card}>
        <Pressable
          style={styles.selectRow}
          onPress={() => setLanguageModal(true)}
        >
          <View>
            <Text style={styles.inputLabel}>{i18n.t("settings.appSettings.language")}</Text>
            <Text style={styles.selectedValue}>
              {getLanguageLabel()}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#26A69A" />
        </Pressable>

        <View style={styles.divider} />

        <View style={styles.selectRow}>
          <View>
            <Text style={styles.inputLabel}>{i18n.t("settings.appSettings.notifications")}</Text>
            <Text style={styles.placeholderText}>
              {notifications ? i18n.t("common.enabled") : i18n.t("common.disabled")}
            </Text>
          </View>
          <Pressable
            style={[
              styles.toggle,
              notifications && styles.toggleActive,
            ]}
            onPress={() => setNotifications(!notifications)}
          >
            <View
              style={[
                styles.toggleThumb,
                notifications && styles.toggleThumbActive,
              ]}
            />
          </Pressable>
        </View>

        <View style={styles.divider} />

        <View style={styles.selectRow}>
          <View>
            <Text style={styles.inputLabel}>{i18n.t("settings.appSettings.darkMode")}</Text>
            <Text style={styles.placeholderText}>
              {darkMode ? i18n.t("common.enabled") : i18n.t("common.disabled")}
            </Text>
          </View>
          <Pressable
            style={[styles.toggle, darkMode && styles.toggleActive]}
            onPress={() => setDarkMode(!darkMode)}
          >
            <View
              style={[
                styles.toggleThumb,
                darkMode && styles.toggleThumbActive,
              ]}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}
