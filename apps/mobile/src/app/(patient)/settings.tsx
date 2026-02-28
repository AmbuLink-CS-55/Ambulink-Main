import { View, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import i18n from "@/common/i18n/i18n";
import { SettingsProvider, useSettings } from "@/common/hooks/SettingsContext";

// Sections
import PersonalSection from "./components/settings/PersonalSection";
import MedicalSection from "./components/settings/MedicalSection";
import EmergencyContactsSection from "./components/settings/EmergencyContactsSection";
import AppSettingsSection from "./components/settings/AppSettingsSection";

// Modals
import BloodTypeModal from "./components/settings/modals/BloodTypeModal";
import LanguageModal from "./components/settings/modals/LanguageModal";
import AllergiesModal from "./components/settings/modals/AllergiesModal";
import EmergencyContactModal from "./components/settings/modals/EmergencyContactModal";

import { BLOOD_TYPES, LANGUAGES, ALLERGIES_LIST } from "@/common/constants/settings";

export default function Settings() {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
}

function SettingsContent() {
  const {
    loaded,
    settings,
    updateSetting,
    activeModal,
    setActiveModal,
    allergiesSearch,
    setAllergiesSearch,
    contactName,
    setContactName,
    emergencyContactNumber,
    setEmergencyContactNumber,
    isEditingContact,
    handleAddAllergy,
    handleRemoveAllergy,
    handleAddEmergencyContact,
    resetEmergencyContactForm,
    handleLanguageChange,
  } = useSettings();

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
    <SafeAreaView className="flex-1" edges={["top", "left", "right"]}>
      <ScrollView className="p-4" contentContainerStyle={{ paddingBottom: 4, paddingTop: 7 }}>
        <View>
          <Text className="text-3xl font-bold pb-5">{i18n.t("settings.title")}</Text>
        </View>

        <PersonalSection />
        <MedicalSection />
        <EmergencyContactsSection />
        <AppSettingsSection />

        <View style={{ height: 40 }} />

        {activeModal === "bloodType" && (
          <BloodTypeModal
            visible
            onClose={() => setActiveModal(null)}
            bloodType={settings.bloodType}
            setBloodType={(v) => updateSetting("bloodType", v)}
            bloodTypes={BLOOD_TYPES}
          />
        )}

        {activeModal === "allergies" && (
          <AllergiesModal
            visible
            onClose={() => setActiveModal(null)}
            selectedAllergies={settings.selectedAllergies}
            onAddAllergy={handleAddAllergy}
            onRemoveAllergy={handleRemoveAllergy}
            allergiesList={ALLERGIES_LIST}
            allergiesSearch={allergiesSearch}
            setAllergiesSearch={setAllergiesSearch}
          />
        )}

        {activeModal === "contact" && (
          <EmergencyContactModal
            visible
            onClose={() => {
              setActiveModal(null);
              resetEmergencyContactForm();
            }}
            contactName={contactName}
            setContactName={setContactName}
            emergencyContactNumber={emergencyContactNumber}
            setEmergencyContactNumber={setEmergencyContactNumber}
            isEditing={isEditingContact}
            onSubmit={handleAddEmergencyContact}
          />
        )}

        {activeModal === "language" && (
          <LanguageModal
            visible
            onClose={() => setActiveModal(null)}
            language={settings.language}
            setLanguage={handleLanguageChange}
            languages={LANGUAGES}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
