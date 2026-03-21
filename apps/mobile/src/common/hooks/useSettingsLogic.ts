import { useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "react-native";
import i18n from "@/common/i18n/i18n";
import {
  loadSettings,
  saveSettings,
  defaultSettings,
  type SettingsData,
  type EmergencyContact,
} from "@/common/utils/settingsStorage";
import type { Allergie } from "@/common/constants/settings";

export type ActiveModal = "bloodType" | "allergies" | "contact" | "language" | null;

const SAVE_DEBOUNCE_MS = 300;

export function useSettingsLogic() {
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [allergiesSearch, setAllergiesSearch] = useState("");

  const [contactName, setContactName] = useState("");
  const [emergencyContactNumber, setEmergencyContactNumber] = useState("");
  const [editingContactId, setEditingContactId] = useState<number | null>(null);

  const updateSetting = useCallback(
    <K extends keyof SettingsData>(key: K, value: SettingsData[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const saved = await loadSettings();
        if (!isMounted) return;
        setSettings(saved);
        if (saved.language) {
          i18n.locale = saved.language;
        }
      } catch {
        Alert.alert(i18n.t("common.error"), "Failed to load settings");
      } finally {
        if (isMounted) setLoaded(true);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    // NOTE: Could be a race condition (settings saving issues)
    const timer = setTimeout(() => {
      saveSettings(settings).catch(() => {
        Alert.alert(i18n.t("common.error"), "Failed to save settings");
      });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [settings, loaded]);

  const handleAddAllergy = useCallback(
    (allergy: Allergie) => {
      if (!settings.selectedAllergies.includes(allergy)) {
        updateSetting("selectedAllergies", [...settings.selectedAllergies, allergy]);
      }
    },
    [settings.selectedAllergies, updateSetting]
  );

  const handleRemoveAllergy = useCallback(
    (allergy: Allergie) => {
      updateSetting(
        "selectedAllergies",
        settings.selectedAllergies.filter((a) => a !== allergy)
      );
    },
    [settings.selectedAllergies, updateSetting]
  );

  const resetEmergencyContactForm = useCallback(() => {
    setEmergencyContactNumber("");
    setContactName("");
    setEditingContactId(null);
  }, []);

  const handleEditEmergencyContact = useCallback((contact: EmergencyContact) => {
    setEmergencyContactNumber(contact.number);
    setContactName(contact.name);
    setEditingContactId(contact.id);
    setActiveModal("contact");
  }, []);

  const handleDeleteEmergencyContact = useCallback(
    (id: number) => {
      updateSetting(
        "emergencyContacts",
        settings.emergencyContacts.filter((c) => c.id !== id)
      );
    },
    [settings.emergencyContacts, updateSetting]
  );

  const handleDeleteMedicalDocument = useCallback(
    (uri: string) => {
      updateSetting(
        "medicalDocuments",
        settings.medicalDocuments.filter((doc) => doc.uri !== uri)
      );
    },
    [settings.medicalDocuments, updateSetting]
  );

  const handleAddEmergencyContact = useCallback(() => {
    if (!emergencyContactNumber.trim()) {
      Alert.alert(i18n.t("common.error"), i18n.t("common.pleaseEnterContactNumber"));
      return;
    }

    if (editingContactId) {
      updateSetting(
        "emergencyContacts",
        settings.emergencyContacts.map((contact) =>
          contact.id === editingContactId
            ? { ...contact, number: emergencyContactNumber, name: contactName }
            : contact
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
    setActiveModal(null);
  }, [
    contactName,
    editingContactId,
    emergencyContactNumber,
    resetEmergencyContactForm,
    settings.emergencyContacts,
    updateSetting,
  ]);

  const handleLanguageChange = useCallback(
    (newLanguage: string) => {
      updateSetting("language", newLanguage);
      i18n.locale = newLanguage;
    },
    [updateSetting]
  );

  const isEditingContact = useMemo(() => editingContactId !== null, [editingContactId]);

  const contextValue = {
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
    editingContactId,
    isEditingContact,
    handleAddAllergy,
    handleRemoveAllergy,
    handleAddEmergencyContact,
    handleDeleteEmergencyContact,
    handleDeleteMedicalDocument,
    handleEditEmergencyContact,
    resetEmergencyContactForm,
    handleLanguageChange,
  };

  return contextValue;
}

export type UseSettingsLogicReturn = ReturnType<typeof useSettingsLogic>;
