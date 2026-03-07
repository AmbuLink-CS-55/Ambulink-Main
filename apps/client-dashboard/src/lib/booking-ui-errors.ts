import { isAxiosError } from "axios";

const BOOKING_ERROR_MESSAGES: Record<string, string> = {
  BOOKING_DRIVER_BUSY: "Selected driver is currently busy. Choose another driver.",
  BOOKING_OUTSIDE_PROVIDER_SCOPE: "You can only manage bookings and drivers within your provider.",
  BOOKING_ASSIGNED_TO_ANOTHER_DISPATCHER: "This booking is currently owned by another dispatcher.",
  BOOKING_NOT_FOUND: "Booking was not found. Refresh and try again.",
  DRIVER_NOT_FOUND: "Selected driver was not found.",
  HOSPITAL_NOT_FOUND: "Selected hospital was not found.",
  DISPATCHER_NOT_FOUND: "Dispatcher identity is invalid. Please sign in again.",
};

type ApiErrorBody = {
  code?: unknown;
  message?: unknown;
  error?: unknown;
};

function normalizeApiErrorBody(input: unknown): { code: string | null; message: string } {
  if (!input || typeof input !== "object") {
    return { code: null, message: "" };
  }

  const body = input as ApiErrorBody;

  const code = typeof body.code === "string" ? body.code : null;

  if (typeof body.message === "string") {
    return { code, message: body.message };
  }

  if (Array.isArray(body.message) && typeof body.message[0] === "string") {
    return { code, message: body.message[0] };
  }

  if (body.error && typeof body.error === "object") {
    const nested = body.error as ApiErrorBody;
    if (typeof nested.message === "string") {
      return {
        code: code ?? (typeof nested.code === "string" ? nested.code : null),
        message: nested.message,
      };
    }
  }

  if (typeof body.error === "string") {
    return { code, message: body.error };
  }

  return { code, message: "" };
}

export function getBookingActionErrorMessage(error: unknown) {
  if (!isAxiosError(error)) {
    return "Action failed. Please try again.";
  }

  const normalized = normalizeApiErrorBody(error.response?.data);

  if (normalized.code && BOOKING_ERROR_MESSAGES[normalized.code]) {
    return BOOKING_ERROR_MESSAGES[normalized.code];
  }

  return normalized.message || error.message || "Action failed. Please try again.";
}
