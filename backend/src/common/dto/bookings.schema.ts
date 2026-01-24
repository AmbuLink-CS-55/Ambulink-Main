import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { bookings } from "@/database/schema";

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  requestedAt: true,
  completedAt: true,
});

export const selectBookingSchema = createSelectSchema(bookings);

export type InsertBookingDto = z.infer<typeof insertBookingSchema>;
export type SelectBookingDto = z.infer<typeof selectBookingSchema>;
