import AsyncStorage from "@react-native-async-storage/async-storage";

// NOTE: should move types somewhere else
export type EmergencyContact = {
  id: number;
  number: string;
  name: string;
};

export type SettingsData = {
  profileName: string;
  profileImage: string | null;
  bloodType: string;
  selectedAllergies: string[];
  emergencyContacts: EmergencyContact[];
  language: string;
  notifications: boolean;
  darkMode: boolean;
};

const KEY = "ambulink:settings:v1";

export async function loadSettings(): Promise<SettingsData | null> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as SettingsData) : null;
}

export async function saveSettings(data: SettingsData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}
