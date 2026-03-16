import * as schema from "@/core/database/schema";
import { hashPassword } from "@/common/auth/password-hasher";

import { USER_SEED_IDS } from "../seed-ids";
import type { SeedDb } from "../types";

export async function seedUsers(db: SeedDb, providerId: string) {
  const defaultSeedPasswordHash = hashPassword("pw123456");
  await db.insert(schema.users).values([
    {
      id: USER_SEED_IDS.driverOne,
      fullName: "Morgan Lee",
      phoneNumber: "+94770001122",
      email: "driver.one@example.com",
      passwordHash: defaultSeedPasswordHash,
      role: "DRIVER",
      providerId,
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.driverTwo,
      fullName: "Taylor Reed",
      phoneNumber: "+94770001133",
      email: "driver.two@example.com",
      passwordHash: defaultSeedPasswordHash,
      role: "DRIVER",
      providerId,
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.emtOne,
      fullName: "Jordan Blake",
      phoneNumber: "+94770002211",
      email: "emt.one@example.com",
      passwordHash: defaultSeedPasswordHash,
      role: "EMT",
      providerId,
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.emtTwo,
      fullName: "Riley Quinn",
      phoneNumber: "+94770002244",
      email: "emt.two@example.com",
      passwordHash: defaultSeedPasswordHash,
      role: "EMT",
      providerId,
      isActive: true,
      status: "OFFLINE",
    },
    {
      id: USER_SEED_IDS.dispatcherOne,
      fullName: "Sam Parker",
      phoneNumber: "+94770003311",
      email: "dispatcher.one@example.com",
      passwordHash: defaultSeedPasswordHash,
      role: "DISPATCHER",
      providerId,
      isActive: true,
      status: "OFFLINE",
    },
  ]);
}
