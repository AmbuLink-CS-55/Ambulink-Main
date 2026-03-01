import { apiPost } from "./api";
import type { PatientCancelCommand, PatientHelpCommand } from "@ambulink/types";
import { env } from "../../../env";

export async function sendPatientHelp(payload: PatientHelpCommand) {
  return apiPost<{ accepted: boolean }, PatientHelpCommand>("/api/patients/events/help", payload, {
    patientId: env.EXPO_PUBLIC_PATIENT_ID,
  });
}

export async function sendPatientCancel(payload: PatientCancelCommand) {
  return apiPost<{ accepted: boolean }, PatientCancelCommand>(
    "/api/patients/events/cancel",
    payload,
    {
      patientId: env.EXPO_PUBLIC_PATIENT_ID,
    }
  );
}
