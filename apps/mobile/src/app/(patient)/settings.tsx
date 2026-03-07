import { View, ScrollView, Text } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import i18n from "@/common/i18n/i18n";
import { SettingsProvider, useSettings } from "@/common/hooks/SettingsContext";

// Sections
import PersonalSection from "@/features/patient/components/settings/PersonalSection";
import MedicalSection from "@/features/patient/components/settings/MedicalSection";
import EmergencyContactsSection from "@/features/patient/components/settings/EmergencyContactsSection";
import AppSettingsSection from "@/features/patient/components/settings/AppSettingsSection";

// Modals
import BloodTypeModal from "@/features/patient/components/settings/modals/BloodTypeModal";
import LanguageModal from "@/features/patient/components/settings/modals/LanguageModal";
import AllergiesModal from "@/features/patient/components/settings/modals/AllergiesModal";
import EmergencyContactModal from "@/features/patient/components/settings/modals/EmergencyContactModal";

import { BLOOD_TYPES, LANGUAGES, ALLERGIES_LIST } from "@/common/constants/settings";

export default function Settings() {
  return (
    <SettingsProvider>
      <SettingsContent />
    </SettingsProvider>
  );
}

function SettingsContent() {
  const insets = useSafeAreaInsets();
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
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 7,
          paddingBottom: Math.max(insets.bottom + 88, 96),
        }}
      >
        <View>
          <Text className="text-3xl font-bold pb-5">{i18n.t("settings.title")}</Text>
        </View>

        <PersonalSection />
        <MedicalSection />
        <EmergencyContactsSection />
        <AppSettingsSection />
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
