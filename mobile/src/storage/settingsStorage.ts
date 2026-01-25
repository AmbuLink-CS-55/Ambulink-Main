import AsyncStorage from "@react-native-async-storage/async-storage";

export type EmergencyContact = {
  id: number;
  number: string;
  name: string;
};

export type SettingsData = {
  profileName: string;
  profileMobile: string;
  profileImage: string | null;
  bloodType: string;
  selectedAllergies: string[];
  emergencyContacts: EmergencyContact[];
  language: string;
  notifications: boolean;
  darkMode: boolean;
};

export const defaultSettings: SettingsData = {
  profileName: "",
  profileMobile: "",
  profileImage: null,
  bloodType: "",
  selectedAllergies: [],
  emergencyContacts: [{ id: 1, number: "119", name: "Police" }],
  language: "en",
  notifications: true,
  darkMode: false,
};

const KEY = "ambulink:settings:v1";

export async function loadSettings(): Promise<SettingsData> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? { ...defaultSettings, ...JSON.parse(raw) } : defaultSettings;
}

export async function saveSettings(data: SettingsData): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(data));
}
