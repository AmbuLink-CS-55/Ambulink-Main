import { sql } from "drizzle-orm";

import * as schema from "@/common/database/schema";

import { PROVIDER_SEED_IDS, USER_SEED_IDS } from "../seed-ids";
import type { SeedDb } from "../types";

export async function seedUsers(db: SeedDb) {
  await db.insert(schema.users).values([
    {
      id: USER_SEED_IDS.patientPrimary,
      fullName: "Alex Carter",
      phoneNumber: "+94771234567",
      email: "alex.carter@example.com",
      passwordHash: "pw123",
      role: "PATIENT",
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.patientGuest,
      fullName: "Guest",
      phoneNumber: "+94774567890",
      email: "guest.patient@example.com",
      passwordHash: "pw123",
      role: "PATIENT",
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.driverOne,
      fullName: "Morgan Lee",
      phoneNumber: "+94770001122",
      email: "driver.one@example.com",
      passwordHash: "pw123",
      role: "DRIVER",
      providerId: PROVIDER_SEED_IDS.ambulinkPrivate,
      isActive: true,
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)`,
    },
    {
      id: USER_SEED_IDS.driverTwo,
      fullName: "Taylor Reed",
      phoneNumber: "+94770001133",
      email: "driver.two@example.com",
      passwordHash: "pw123",
      role: "DRIVER",
      providerId: PROVIDER_SEED_IDS.suwaSeriyaColomboCentral,
      isActive: true,
      status: "AVAILABLE",
      currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8847, 6.8528), 4326)`,
    },
    {
      id: USER_SEED_IDS.emtOne,
      fullName: "Jordan Blake",
      phoneNumber: "+94770002211",
      email: "emt.one@example.com",
      passwordHash: "pw123",
      role: "EMT",
      providerId: PROVIDER_SEED_IDS.ambulinkPrivate,
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.emtTwo,
      fullName: "Riley Quinn",
      phoneNumber: "+94770002244",
      email: "emt.two@example.com",
      passwordHash: "pw123",
      role: "EMT",
      providerId: PROVIDER_SEED_IDS.suwaSeriyaColomboSouth,
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.dispatcherOne,
      fullName: "Sam Parker",
      phoneNumber: "+94770003311",
      email: "dispatcher.one@example.com",
      passwordHash: "pw123",
      role: "DISPATCHER",
      providerId: PROVIDER_SEED_IDS.ambulinkPrivate,
      isActive: true,
      status: "AVAILABLE",
    },
    {
      id: USER_SEED_IDS.dispatcherTwo,
      fullName: "Casey Morgan",
      phoneNumber: "+94770003344",
      email: "dispatcher.two@example.com",
      passwordHash: "pw123",
      role: "DISPATCHER",
      providerId: PROVIDER_SEED_IDS.suwaSeriyaColomboCentral,
      isActive: true,
      status: "AVAILABLE",
    },
  ]);
}
