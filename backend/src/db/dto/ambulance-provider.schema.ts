import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ambulanceProviders } from "../schema";

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
