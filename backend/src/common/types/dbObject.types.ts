import { bookingStatusEnum } from "@/database/schema";

export type BookingStatusType = (typeof bookingStatusEnum.enumValues)[number];
