import { apiPost } from "./api";
import type { PatientCancelCommand, PatientHelpCommand } from "@ambulink/types";

export async function sendPatientHelp(payload: PatientHelpCommand) {
  return apiPost<{ accepted: boolean }, PatientHelpCommand>("/api/patients/events/help", payload);
}

export async function sendPatientCancel(payload: PatientCancelCommand) {
  return apiPost<{ accepted: boolean }, PatientCancelCommand>(
    "/api/patients/events/cancel",
    payload
  );
}
