import { sql } from "drizzle-orm";

import * as schema from "@/common/database/schema";

import type { SeedDb } from "../types";

export async function seedHospitals(db: SeedDb) {
  await db.insert(schema.hospitals).values([
    {
      name: "National Hospital of Sri Lanka",
      hospitalType: "PUBLIC",
      address: "Regent Street, Colombo 10",
      phoneNumber: "011-2691111",
      location: sql`ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)`,
      isActive: true,
    },
    {
      name: "Colombo South Teaching Hospital (Kalubowila)",
      hospitalType: "PUBLIC",
      address: "Kalubowila Road, Dehiwala",
      phoneNumber: "011-2763000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8847, 6.8528), 4326)`,
      isActive: true,
    },
    {
      name: "Colombo North Teaching Hospital (Ragama)",
      hospitalType: "PUBLIC",
      address: "Ragama",
      phoneNumber: "011-2958337",
      location: sql`ST_SetSRID(ST_MakePoint(79.9211, 7.0279), 4326)`,
      isActive: true,
    },
    {
      name: "Sri Jayewardenepura General Hospital",
      hospitalType: "PUBLIC",
      address: "Thalapathpitiya, Nugegoda",
      phoneNumber: "011-2778000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8897, 6.8706), 4326)`,
      isActive: true,
    },
    {
      name: "Lady Ridgeway Hospital for Children",
      hospitalType: "PUBLIC",
      address: "Dr. Danister De Silva Mawatha, Colombo 08",
      phoneNumber: "011-2693711",
      location: sql`ST_SetSRID(ST_MakePoint(79.8675, 6.9201), 4326)`,
      isActive: true,
    },
    {
      name: "Lanka Hospitals",
      hospitalType: "PRIVATE",
      address: "578 Elvitigala Mawatha, Colombo 05",
      phoneNumber: "011-5430000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8773, 6.8942), 4326)`,
      isActive: true,
    },
    {
      name: "Asiri Central Hospital",
      hospitalType: "PRIVATE",
      address: "114 Norris Canal Road, Colombo 10",
      phoneNumber: "011-4660000",
      location: sql`ST_SetSRID(ST_MakePoint(79.858, 6.9298), 4326)`,
      isActive: true,
    },
    {
      name: "Nawaloka Hospital Colombo",
      hospitalType: "PRIVATE",
      address: "23 Deshamanya H.K. Dharmadasa Mawatha, Colombo 02",
      phoneNumber: "011-5577111",
      location: sql`ST_SetSRID(ST_MakePoint(79.8497, 6.9344), 4326)`,
      isActive: true,
    },
    {
      name: "Durdans Hospital",
      hospitalType: "PRIVATE",
      address: "3 Alfred Place, Colombo 03",
      phoneNumber: "011-2140000",
      location: sql`ST_SetSRID(ST_MakePoint(79.8508, 6.9165), 4326)`,
      isActive: true,
    },
    {
      name: "Hemas Hospital Wattala",
      hospitalType: "PRIVATE",
      address: "389 Negombo Road, Wattala",
      phoneNumber: "011-7888888",
      location: sql`ST_SetSRID(ST_MakePoint(79.8917, 6.9892), 4326)`,
      isActive: true,
    },
  ]);
}
