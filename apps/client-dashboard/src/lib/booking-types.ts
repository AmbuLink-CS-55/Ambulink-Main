import type { BookingDecisionPayload, BookingNewPayload } from "@/lib/socket-types";

export type BookingRequestEntity = {
  requestId: string;
  data: BookingNewPayload;
  timestamp: number;
  expiresAt: number;
};

export type BookingDecisionState = {
  status: "pending" | "won" | "lost";
  winner: BookingDecisionPayload["winner"];
};
