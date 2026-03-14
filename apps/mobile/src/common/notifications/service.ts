import type { NotificationActorRole, SocketNotificationPayload } from "./types";
import { toAppNotification } from "./mapper";
import { addInboxNotification } from "./inbox";

const DEDUPE_WINDOW_MS = 10_000;

const dedupeMap = new Map<string, number>();

function shouldDedupe(dedupeKey: string) {
  const now = Date.now();
  const last = dedupeMap.get(dedupeKey) ?? 0;
  if (now - last < DEDUPE_WINDOW_MS) {
    return true;
  }
  dedupeMap.set(dedupeKey, now);
  return false;
}

// Local OS notifications are intentionally disabled for Expo Go compatibility.
export async function initLocalNotifications() {
  return;
}

export async function notifyFromSocket(
  role: NotificationActorRole,
  payload: SocketNotificationPayload
): Promise<void> {
  const appNotification = toAppNotification(role, payload);

  if (shouldDedupe(appNotification.dedupeKey)) {
    return;
  }

  await addInboxNotification(role, appNotification);
}
