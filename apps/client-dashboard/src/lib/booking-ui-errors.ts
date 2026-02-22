import { isAxiosError } from "axios";

export function getBookingActionErrorMessage(error: unknown) {
  if (!isAxiosError(error)) {
    return "Action failed. Please try again.";
  }

  const rawMessage =
    (typeof error.response?.data?.message === "string" && error.response.data.message) ||
    error.message ||
    "";
  const message = rawMessage.toLowerCase();

  if (message.includes("active booking") || message.includes("already has an active booking")) {
    return "Selected driver is currently busy. Choose another driver.";
  }
  if (message.includes("outside provider scope") || message.includes("provider does not match")) {
    return "You can only manage bookings and drivers within your provider.";
  }
  if (message.includes("only the assigned dispatcher")) {
    return "This booking is currently owned by another dispatcher.";
  }
  if (message.includes("booking not found")) {
    return "Booking was not found. Refresh and try again.";
  }
  if (message.includes("driver not found")) {
    return "Selected driver was not found.";
  }
  if (message.includes("hospital not found")) {
    return "Selected hospital was not found.";
  }
  if (message.includes("dispatcher not found")) {
    return "Dispatcher identity is invalid. Please sign in again.";
  }

  return rawMessage || "Action failed. Please try again.";
}
