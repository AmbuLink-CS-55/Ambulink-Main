import * as schema from "@/core/database/schema";

import type { SeedDb } from "../types";

export async function seedAmbulanceProviders(db: SeedDb): Promise<string> {
  const [provider] = await db
    .insert(schema.ambulanceProviders)
    .values({
      name: "ambulink",
      providerType: "PRIVATE",
      hotlineNumber: "+94112345678",
      address: "No. 120, Baseline Road, Colombo 08",
      initialPrice: "2500.00",
      pricePerKm: "150.00",
      isActive: true,
    })
    .returning({ id: schema.ambulanceProviders.id });

  if (!provider?.id) {
    throw new Error("Failed to seed provider: ambulink");
  }

  return provider.id;
}
