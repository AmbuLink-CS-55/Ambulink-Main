import * as schema from "@/common/database/schema";

import type { SeedDb } from "../types";

export async function seedHelplines(db: SeedDb) {
  await db.insert(schema.helplines).values([
    {
      name: "Suwa Seriya - National Ambulance Service",
      phoneNumber: "1990",
      description: "Free 24/7 national ambulance service covering Sri Lanka",
      isActive: true,
    },
    {
      name: "Police Emergency Hotline",
      phoneNumber: "119",
      description: "Sri Lanka Police 24/7 emergency response",
      isActive: true,
    },
    {
      name: "Fire & Rescue Services",
      phoneNumber: "110",
      description: "National fire brigade and rescue operations",
      isActive: true,
    },
    {
      name: "Disaster Management Centre",
      phoneNumber: "117",
      description: "National emergency and disaster response coordination",
      isActive: true,
    },
    {
      name: "Child Protection Helpline",
      phoneNumber: "1929",
      description: "24/7 child abuse and protection reporting",
      isActive: true,
    },
    {
      name: "Government Information Center",
      phoneNumber: "1919",
      description: "Government services and information hotline",
      isActive: true,
    },
  ]);
}
