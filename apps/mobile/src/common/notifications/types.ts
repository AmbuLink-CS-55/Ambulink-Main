export type NotificationEventType =
  | "ASSIGNED"
  | "ETA_UPDATED"
  | "ARRIVED"
  | "REROUTED"
  | "CANCELLED";

export type NotificationActorRole = "PATIENT" | "DRIVER" | "EMT";

export type AppNotification = {
  id: string;
  type: NotificationEventType;
  bookingId: string;
  title: string;
  body: string;
  timestamp: string;
  actorRole: NotificationActorRole;
  dedupeKey: string;
};

export type SocketNotificationPayload =
  | {
      type: "ASSIGNED";
      bookingId: string;
    }
  | {
      type: "ETA_UPDATED";
      bookingId: string;
      etaMinutes: number;
      previousEtaMinutes: number | null;
    }
  | {
      type: "ARRIVED";
      bookingId: string;
    }
  | {
      type: "REROUTED";
      bookingId: string;
      reason: string;
    }
  | {
      type: "CANCELLED";
      bookingId: string;
      reason?: string;
    };
