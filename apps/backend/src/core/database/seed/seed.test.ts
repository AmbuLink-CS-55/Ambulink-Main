import "dotenv/config";

import { seedTestDatabase } from "../../../../test/helpers/seed-db";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run test seed");
}

async function main() {
  await seedTestDatabase(databaseUrl as string);
  console.log("✅ Test seed complete");
}

main().catch((error) => {
  console.error("❌ Test seed failed:", error);
  process.exit(1);
});
