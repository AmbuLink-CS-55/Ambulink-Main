import { getAccessToken, getSessionUser } from "@/stores/auth.store";

export function getDispatcherId() {
  const user = getSessionUser();
  if (!user?.id) {
    throw new Error("Dispatcher session is required");
  }
  return user.id;
}

export function getDispatcherAccessToken() {
  return getAccessToken() ?? "";
}
