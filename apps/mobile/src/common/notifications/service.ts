import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import type { NotificationActorRole, SocketNotificationPayload } from "./types";
import { toAppNotification } from "./mapper";
import { addInboxNotification } from "./inbox";
import { areNotificationsEnabled } from "./preferences";

const DEDUPE_WINDOW_MS = 10_000;
const ANDROID_CHANNEL_ID = "ambulink-live";

const dedupeMap = new Map<string, number>();
let initialized = false;
let osNotificationPermissionGranted = false;

function shouldDedupe(dedupeKey: string) {
  const now = Date.now();
  const last = dedupeMap.get(dedupeKey) ?? 0;
  if (now - last < DEDUPE_WINDOW_MS) {
    return true;
  }
  dedupeMap.set(dedupeKey, now);
  return false;
}

export async function initLocalNotifications() {
  if (initialized) return;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    const requested = await Notifications.requestPermissionsAsync();
    osNotificationPermissionGranted = requested.granted;
  } else {
    osNotificationPermissionGranted = true;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: "Ambulink Live",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }

  initialized = true;
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

  const enabled = await areNotificationsEnabled(role);
  if (!enabled) {
    return;
  }

  if (!initialized) {
    await initLocalNotifications();
  }

  if (!osNotificationPermissionGranted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: appNotification.title,
      body: appNotification.body,
      data: {
        bookingId: appNotification.bookingId,
        type: appNotification.type,
      },
    },
    trigger: null,
  });
}
