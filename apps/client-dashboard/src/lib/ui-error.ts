import axios from "axios";

function hasStatusCodeMessage(text: string) {
  return /request failed with status code\s+\d+/i.test(text);
}

export function toUiErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data as { message?: unknown } | undefined;
    const apiMessage = responseData?.message;

    if (typeof apiMessage === "string" && apiMessage.trim()) {
      if (hasStatusCodeMessage(apiMessage)) {
        return fallback;
      }
      return apiMessage;
    }

    if (Array.isArray(apiMessage)) {
      const first = apiMessage.find((item) => typeof item === "string" && item.trim());
      if (typeof first === "string" && !hasStatusCodeMessage(first)) {
        return first;
      }
    }

    if (error.code === "ERR_NETWORK") {
      return "Unable to reach the server. Check your connection and try again.";
    }

    return fallback;
  }

  if (error instanceof Error) {
    if (!error.message || hasStatusCodeMessage(error.message)) {
      return fallback;
    }
    return error.message;
  }

  return fallback;
}
