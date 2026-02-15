import { View, ScrollView, Text } from "react-native";

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
import { ALLERGIES_LIST, BLOOD_TYPES, LANGUAGES } from "@/constants/settings";
import { useSettingsLogic } from "@/hooks/useSettingsLogic";

export default function Settings() {
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
    handleDeleteEmergencyContact,
    handleEditEmergencyContact,
    resetEmergencyContactForm,
    handleLanguageChange,
  } = useSettingsLogic();

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

        <PersonalSection
          profileName={settings.profileName}
          setProfileName={(v) => updateSetting("profileName", v)}
          profileMobile={settings.profileMobile}
          setProfileMobile={(v) => updateSetting("profileMobile", v)}
        />

        <MedicalSection
          bloodType={settings.bloodType}
          setBloodTypeModal={(visible) => setActiveModal(visible ? "bloodType" : null)}
          selectedAllergies={settings.selectedAllergies}
          setAllergiesModal={(visible) => setActiveModal(visible ? "allergies" : null)}
        />

        <EmergencyContactsSection
          emergencyContacts={settings.emergencyContacts}
          setEmergencyContactModal={(visible) => setActiveModal(visible ? "contact" : null)}
          resetForm={resetEmergencyContactForm}
          onEdit={handleEditEmergencyContact}
          onDelete={handleDeleteEmergencyContact}
        />

        <AppSettingsSection
          language={settings.language}
          setLanguageModal={(visible) => setActiveModal(visible ? "language" : null)}
          notifications={settings.notifications}
          setNotifications={(v) => updateSetting("notifications", v)}
          darkMode={settings.darkMode}
          setDarkMode={(v) => updateSetting("darkMode", v)}
        />

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
