import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY_PREFIX = "ambulink:patient:active-booking:v1";

function bookingKey(patientId: string) {
  return `${KEY_PREFIX}:${patientId}`;
}

export async function saveActivePatientBookingId(patientId: string, bookingId: string) {
  try {
    await AsyncStorage.setItem(bookingKey(patientId), bookingId);
  } catch (error) {
    console.warn("[patient-booking-storage] save failed", error);
  }
}

export async function loadActivePatientBookingId(patientId: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(bookingKey(patientId));
  } catch (error) {
    console.warn("[patient-booking-storage] load failed", error);
    return null;
  }
}

export async function clearActivePatientBookingId(patientId: string) {
  try {
    await AsyncStorage.removeItem(bookingKey(patientId));
  } catch (error) {
    console.warn("[patient-booking-storage] clear failed", error);
  }
}
