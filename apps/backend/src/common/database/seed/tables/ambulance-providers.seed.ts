import * as schema from "@/common/database/schema";

import { PROVIDER_SEED_IDS } from "../seed-ids";
import type { SeedDb } from "../types";

export async function seedAmbulanceProviders(db: SeedDb) {
  await db.insert(schema.ambulanceProviders).values([
    {
      id: PROVIDER_SEED_IDS.ambulinkPrivate,
      name: "Ambulink Emergency Response",
      providerType: "PRIVATE",
      hotlineNumber: "+94112345678",
      address: "No. 120, Baseline Road, Colombo 08",
      initialPrice: "2500.00",
      pricePerKm: "150.00",
      isActive: true,
    },
    {
      id: PROVIDER_SEED_IDS.suwaSeriyaColomboCentral,
      name: "1990 Suwa Seriya - Colombo Central",
      providerType: "PUBLIC",
      hotlineNumber: "1990",
      address: "Colombo Central Dispatch Hub, Colombo 10",
      initialPrice: "0.00",
      pricePerKm: "0.00",
      isActive: true,
    },
    {
      id: PROVIDER_SEED_IDS.suwaSeriyaColomboSouth,
      name: "1990 Suwa Seriya - Colombo South",
      providerType: "PUBLIC",
      hotlineNumber: "1990",
      address: "Kalubowila Regional Response Center, Dehiwala",
      initialPrice: "0.00",
      pricePerKm: "0.00",
      isActive: true,
    },
    {
      id: PROVIDER_SEED_IDS.lankaHospitals,
      name: "Lanka Hospitals Ambulance Service",
      providerType: "PRIVATE",
      hotlineNumber: "011-5430000",
      address: "578 Elvitigala Mawatha, Colombo 05",
      initialPrice: "3500.00",
      pricePerKm: "200.00",
      isActive: true,
    },
    {
      id: PROVIDER_SEED_IDS.asiriEms,
      name: "Asiri Emergency Medical Services",
      providerType: "PRIVATE",
      hotlineNumber: "011-4523300",
      address: "181 Kirula Road, Colombo 05",
      initialPrice: "3000.00",
      pricePerKm: "180.00",
      isActive: true,
    },
    {
      id: PROVIDER_SEED_IDS.nawalokaAmbulance,
      name: "Nawaloka Ambulance Service",
      providerType: "PRIVATE",
      hotlineNumber: "011-5577111",
      address: "23 Deshamanya H.K. Dharmadasa Mawatha, Colombo 02",
      initialPrice: "2800.00",
      pricePerKm: "160.00",
      isActive: true,
    },
  ]);
}
