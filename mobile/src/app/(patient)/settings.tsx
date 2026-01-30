import { View, ScrollView, Text, Alert } from "react-native";
import {
  loadSettings,
  saveSettings,
  defaultSettings,
  type SettingsData,
  type EmergencyContact,
} from "@/utils/settingsStorage";
import { useEffect, useState, useCallback, useRef } from "react";
import * as ImagePicker from "expo-image-picker";

import AppSettingsSection from "@/components/patient/settings/AppSettingsSection";
import EmergencyContactsSection from "@/components/patient/settings/EmergencyContactsSection";
import MedicalSection from "@/components/patient/settings/MedicalSection";
import AllergiesModal from "@/components/patient/settings/modals/AllergiesModal";
import BloodTypeModal from "@/components/patient/settings/modals/BloodTypeModal";
import EmergencyContactModal from "@/components/patient/settings/modals/EmergencyContactModal";
import LanguageModal from "@/components/patient/settings/modals/LanguageModal";
import PersonalSection from "@/components/patient/settings/PersonalSection";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/i18n/i18n";

const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];
const ALLERGIES_LIST = [
  "Peanuts",
  "Tree nuts",
  "Shellfish",
  "Fish",
  "Eggs",
  "Milk",
  "Soy",
  "Wheat",
  "Sesame",
  "Sulfites",
  "Penicillin",
  "Aspirin",
  "Ibuprofen",
  "Latex",
];
const LANGUAGES = [
  { id: "en", label: i18n.t("languages.english") },
  { id: "si", label: i18n.t("languages.sinhala") },
  { id: "ta", label: i18n.t("languages.tamil") },
];

export default function Settings() {
  const [loaded, setLoaded] = useState(false);

  // Modals
  const [bloodTypeModal, setBloodTypeModal] = useState(false);
  const [allergiesModal, setAllergiesModal] = useState(false);
  const [allergiesSearch, setAllergiesSearch] = useState("");
  const [emergencyContactModal, setEmergencyContactModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);

  // Data
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [contactName, setContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [editingContactId, setEditingContactId] = useState<number | null>(null);

  // prevents rerender
  const updateSetting = useCallback(
    <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  useEffect(() => {
    (async () => {
      try {
        const saved = await loadSettings();
        setSettings(saved);
        if (saved.language) {
          i18n.locale = saved.language;
        }
      } catch {
        Alert.alert(i18n.t("common.error"), "Failed to load settings");
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const handleAddAllergy = (allergy: string) => {
    if (!settings.selectedAllergies.includes(allergy)) {
      updateSetting("selectedAllergies", [
        ...settings.selectedAllergies,
        allergy,
      ]);
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    updateSetting(
      "selectedAllergies",
      settings.selectedAllergies.filter((a) => a !== allergy)
    );
  };

  const handleAddEmergencyContact = () => {
    if (!emergencyContactNumber.trim()) {
      Alert.alert(
        i18n.t("common.error"),
        i18n.t("common.pleaseEnterContactNumber")
      );
      return;
    }

    if (editingContactId) {
      updateSetting(
        "emergencyContacts",
        settings.emergencyContacts.map((c) =>
          c.id === editingContactId
            ? { ...c, number: emergencyContactNumber, name: contactName }
            : c
        )
      );
    } else {
      updateSetting("emergencyContacts", [
        ...settings.emergencyContacts,
        {
          id: Date.now(),
          number: emergencyContactNumber,
          name: contactName || "Contact",
        },
      ]);
    }

    resetEmergencyContactForm();
    setEmergencyContactModal(false);
  };

  const handleDeleteEmergencyContact = (id: number) => {
    updateSetting(
      "emergencyContacts",
      settings.emergencyContacts.filter((c) => c.id !== id)
    );
  };

  const handleEditEmergencyContact = (contact: EmergencyContact) => {
    setEmergencyContactNumber(contact.number);
    setContactName(contact.name);
    setEditingContactId(contact.id);
    setEmergencyContactModal(true);
  };

  const resetEmergencyContactForm = () => {
    setEmergencyContactNumber("");
    setContactName("");
    setEditingContactId(null);
  };

  const handleLanguageChange = (newLanguage: string) => {
    updateSetting("language", newLanguage);
    i18n.locale = newLanguage;
  };

  if (!loaded) {
    return (
      <SafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center align-middle h-screen w-screen">
          <Text className="font-bold">Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      className="flex-1"
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        className="p-4"
        contentContainerStyle={{ paddingBottom: 4, paddingTop: 7 }}
      >
        <View>
          <Text className="text-3xl font-bold pb-5">{i18n.t("settings.title")}</Text>
        </View>

        <PersonalSection
          profileName={settings.profileName}
          setProfileName={(v) => updateSetting("profileName", v)}
          profileMobile={settings.profileMobile}
          setProfileMobile={(v) => updateSetting("profileMobile", v)}
        />

        <MedicalSection
          bloodType={settings.bloodType}
          setBloodTypeModal={setBloodTypeModal}
          selectedAllergies={settings.selectedAllergies}
          setAllergiesModal={setAllergiesModal}
        />

        <EmergencyContactsSection
          emergencyContacts={settings.emergencyContacts}
          setEmergencyContactModal={setEmergencyContactModal}
          resetForm={resetEmergencyContactForm}
          onEdit={handleEditEmergencyContact}
          onDelete={handleDeleteEmergencyContact}
        />

        <AppSettingsSection
          language={settings.language}
          setLanguageModal={setLanguageModal}
          notifications={settings.notifications}
          setNotifications={(v) => updateSetting("notifications", v)}
          darkMode={settings.darkMode}
          setDarkMode={(v) => updateSetting("darkMode", v)}
        />

        <View style={{ height: 40 }} />

        {bloodTypeModal && (
          <BloodTypeModal
            visible={bloodTypeModal}
            onClose={() => setBloodTypeModal(false)}
            bloodType={settings.bloodType}
            setBloodType={(v) => updateSetting("bloodType", v)}
            bloodTypes={BLOOD_TYPES}
          />
        )}

        {allergiesModal && (
          <AllergiesModal
            visible={allergiesModal}
            onClose={() => setAllergiesModal(false)}
            selectedAllergies={settings.selectedAllergies}
            onAddAllergy={handleAddAllergy}
            onRemoveAllergy={handleRemoveAllergy}
            allergiesList={ALLERGIES_LIST}
            allergiesSearch={allergiesSearch}
            setAllergiesSearch={setAllergiesSearch}
          />
        )}

        {emergencyContactModal && (
          <EmergencyContactModal
            visible={emergencyContactModal}
            onClose={() => {
              setEmergencyContactModal(false);
              resetEmergencyContactForm();
            }}
            contactName={contactName}
            setContactName={setContactName}
            emergencyContactNumber={emergencyContactNumber}
            setEmergencyContactNumber={setEmergencyContactNumber}
            isEditing={editingContactId !== null}
            onSubmit={handleAddEmergencyContact}
          />
        )}

        {languageModal && (
          <LanguageModal
            visible={languageModal}
            onClose={() => setLanguageModal(false)}
            language={settings.language}
            setLanguage={handleLanguageChange}
            languages={LANGUAGES}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
