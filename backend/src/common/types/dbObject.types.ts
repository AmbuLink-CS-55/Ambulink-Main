import { bookingStatusEnum } from "@/common/database/schema";

export type BookingStatusType = (typeof bookingStatusEnum.enumValues)[number];
