import { View, ScrollView, Pressable, Text, Alert } from "react-native";
import { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { styles } from "@/components/styles";
import AppSettingsSection from "@/components/settings/AppSettingsSection";
import EmergencyContactsSection from "@/components/settings/EmergencyContactsSection";
import MedicalSection from "@/components/settings/MedicalSection";
import AllergiesModal from "@/components/settings/modals/AllergiesModal";
import BloodTypeModal from "@/components/settings/modals/BloodTypeModal";
import EmergencyContactModal from "@/components/settings/modals/EmergencyContactModal";
import LanguageModal from "@/components/settings/modals/LanguageModal";
import PersonalSection from "@/components/settings/PersonalSection";

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
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "si", label: "Sinhala", flag: "🇱🇰" },
  { id: "ta", label: "Tamil", flag: "🇮🇳" },
];

export default function Settings() {
  // Personal state
  const [profileName, setProfileName] = useState("Sutharaka F");
  const [profileImage, setProfileImage] = useState<string | null>(null);

  // Medical state
  const [bloodType, setBloodType] = useState("O+");
  const [selectedAllergies, setSelectedAllergies] = useState<string[]>([]);

  // Emergency contacts state
  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, number: "119", name: "Bro" },
  ]);
  const [contactName, setContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [editingContactId, setEditingContactId] = useState<number | null>(
    null
  );

  // App settings state
  const [language, setLanguage] = useState("en");
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Modal visibility state
  const [bloodTypeModal, setBloodTypeModal] = useState(false);
  const [allergiesModal, setAllergiesModal] = useState(false);
  const [allergiesSearch, setAllergiesSearch] = useState("");
  const [emergencyContactModal, setEmergencyContactModal] = useState(false);
  const [languageModal, setLanguageModal] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleAddAllergy = (allergy: string) => {
    if (!selectedAllergies.includes(allergy)) {
      setSelectedAllergies([...selectedAllergies, allergy]);
    }
  };

  const handleRemoveAllergy = (allergy: string) => {
    setSelectedAllergies(selectedAllergies.filter((a) => a !== allergy));
  };

  const handleAddEmergencyContact = () => {
    if (!emergencyContactNumber.trim()) {
      Alert.alert("Error", "Please enter a contact number");
      return;
    }

    if (editingContactId) {
      setEmergencyContacts(
        emergencyContacts.map((c) =>
          c.id === editingContactId
            ? { ...c, number: emergencyContactNumber, name: contactName }
            : c
        )
      );
      setEditingContactId(null);
    } else {
      setEmergencyContacts([
        ...emergencyContacts,
        {
          id: Date.now(),
          number: emergencyContactNumber,
          name: contactName || "Contact",
        },
      ]);
    }

    setEmergencyContactNumber("");
    setContactName("");
    setEmergencyContactModal(false);
  };

  const handleDeleteEmergencyContact = (id: number) => {
    setEmergencyContacts(emergencyContacts.filter((c) => c.id !== id));
  };

  const handleEditEmergencyContact = (contact: any) => {
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

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <PersonalSection
        profileName={profileName}
        setProfileName={setProfileName}
        profileImage={profileImage}
        onPickImage={handlePickImage}
      />

      <MedicalSection
        bloodType={bloodType}
        setBloodTypeModal={setBloodTypeModal}
        selectedAllergies={selectedAllergies}
        setAllergiesModal={setAllergiesModal}
      />

      <EmergencyContactsSection
        emergencyContacts={emergencyContacts}
        setEmergencyContactModal={setEmergencyContactModal}
        resetForm={resetEmergencyContactForm}
        onEdit={handleEditEmergencyContact}
        onDelete={handleDeleteEmergencyContact}
      />

      <AppSettingsSection
        language={language}
        setLanguageModal={setLanguageModal}
        notifications={notifications}
        setNotifications={setNotifications}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />

      <Pressable style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Changes</Text>
      </Pressable>

      <View style={{ height: 40 }} />

      {bloodTypeModal && (
        <BloodTypeModal
          visible={bloodTypeModal}
          onClose={() => setBloodTypeModal(false)}
          bloodType={bloodType}
          setBloodType={setBloodType}
          bloodTypes={BLOOD_TYPES}
        />
      )}

      {allergiesModal && (
        <AllergiesModal
          visible={allergiesModal}
          onClose={() => setAllergiesModal(false)}
          selectedAllergies={selectedAllergies}
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
          language={language}
          setLanguage={setLanguage}
          languages={LANGUAGES}
        />
      )}
    </ScrollView>
  );
}
