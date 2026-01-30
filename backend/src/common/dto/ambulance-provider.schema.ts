import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ambulanceProviders } from "@/common/database/schema";

export const insertAmbulanceProviderSchema = createInsertSchema(
  ambulanceProviders
).omit({
  id: true,
  createdAt: true,
});

export const selectAmbulanceProviderSchema =
  createSelectSchema(ambulanceProviders);

export type InsertAmbulanceProviderDto = z.infer<
  typeof insertAmbulanceProviderSchema
>;
export type SelectAmbulanceProviderDto = z.infer<
  typeof selectAmbulanceProviderSchema
>;
