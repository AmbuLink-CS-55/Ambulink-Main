import env from "@/../env";

const DISPATCHER_ID_STORAGE_KEY = "ambulink.dispatcherId";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string | null | undefined): value is string {
  return Boolean(value && uuidPattern.test(value));
}

export function getDispatcherId() {
  if (isUuid(env.VITE_DISPATCHER_ID)) {
    globalThis.localStorage?.setItem(DISPATCHER_ID_STORAGE_KEY, env.VITE_DISPATCHER_ID);
    return env.VITE_DISPATCHER_ID;
  }

  const stored = globalThis.localStorage?.getItem(DISPATCHER_ID_STORAGE_KEY);
  if (isUuid(stored)) {
    return stored;
  }

  if (typeof globalThis.prompt !== "function") {
    throw new Error("Dispatcher ID is required");
  }

  const typed = globalThis.prompt("Enter dispatcher ID (UUID)")?.trim();
  if (!isUuid(typed)) {
    throw new Error("A valid dispatcher ID (UUID) is required");
  }

  globalThis.localStorage?.setItem(DISPATCHER_ID_STORAGE_KEY, typed);
  return typed;
}
