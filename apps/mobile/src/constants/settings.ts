import i18n from "@/i18n/i18n";

export const BLOOD_TYPES = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"] as const;
export type BloodType = (typeof BLOOD_TYPES)[number] | "";

export const ALLERGIES_LIST = [
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
] as const;
export type Allergie = (typeof ALLERGIES_LIST)[number] | "";

export const LANGUAGES = [
  { id: "en", label: i18n.t("languages.english") },
  { id: "si", label: i18n.t("languages.sinhala") },
  { id: "ta", label: i18n.t("languages.tamil") },
];
