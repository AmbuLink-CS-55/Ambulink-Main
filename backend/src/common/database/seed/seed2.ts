import * as schema from "@/common/database/schema";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { reset, seed } from "drizzle-seed";
import env from "env";
import { sql } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { prepare: false });

async function toPoint(lat: number, lng: number) {
  return sql`ST_GeomFromText(POINT(${lng} ${lat}), 4326)`;
}

async function main() {
  const db = drizzle(client, { schema });
  console.log("reseting DB");
  await reset(db, schema);
  console.log("seeding");

  await db.insert(schema.users).values({
    id: env.PATIENT_ID,
    fullName: "Joe Patient",
    phoneNumber: "+94771234567",
    email: "patient@example.com",
    passwordHash: "pw123",
    role: "PATIENT",
    isActive: true,
    status: "OFFLINE",
    // currentLocation: sql`ST_SetSRID(ST_MakePoint(79.85469529731564,6.901523549363248), 4326)`,
  });

  const [customProvider] = await db
    .insert(schema.ambulanceProviders)
    .values({
      name: "AMBULINK AMBULANCE PROVIDERS",
      providerType: "PRIVATE",
      hotlineNumber: "+94112345678",
      address: "123 Main Street, Colombo 03",
      initialPrice: "2500.00",
      pricePerKm: "1500.00",
      isActive: true,
    })
    .returning();

  await db.insert(schema.users).values({
    id: env.DRIVER_ID,
    fullName: "Joe Driver",
    phoneNumber: "+94777654321",
    email: "driver@example.com",
    passwordHash: "pw123",
    role: "DRIVER",
    isActive: true,
    status: "OFFLINE",
    currentLocation: sql`ST_SetSRID(ST_MakePoint(79.85469529731564,6.901523549363248), 4326)`,
    providerId: customProvider.id,
  });

  await db.insert(schema.users).values({
    id: env.EMT_ID,
    fullName: "Joe EMT",
    phoneNumber: "+94777654329",
    email: "emt@example.com",
    passwordHash: "pw123",
    role: "EMT",
    isActive: true,
    status: "OFFLINE",
    currentLocation: sql`ST_SetSRID(ST_MakePoint(79.85369529731564,6.901523549363248), 4326)`,
    providerId: customProvider.id,
  });

  await db.insert(schema.users).values({
    id: env.DISPATCHER_ID,
    fullName: "Joe Dispatcher",
    phoneNumber: "+94777654391",
    email: "dispatcher@example.com",
    passwordHash: "pw123",
    role: "DISPATCHER",
    isActive: true,
    status: "OFFLINE",
    // currentLocation: sql`ST_SetSRID(ST_MakePoint(79.85469529731564,6.901523549363248), 4326)`,
    providerId: customProvider.id,
  });

  await seed(db, schema, { count: 10 }).refine((f) => ({
    users: {
      columns: {
        isActive: f.default({ defaultValue: true }),
        status: f.default({ defaultValue: "OFFLINE" }),
        currentLocation: f.point({
          minXValue: 79.84,
          maxXValue: 79.95,
          minYValue: 6.83,
          maxYValue: 6.98,
        }),
      },
    },
    ambulanceProviders: {
      count: 10,
      columns: {
        name: f.valuesFromArray({
          values: [
            "1990 Suwa Seriya",
            "St. John Ambulance Sri Lanka",
            "Royal Nursing Home Ambulance",
            "Medihelp Ambulance Service",
            "Sitrek Swift Care",
            "Lanka Hospitals Emergency",
            "Nawaloka Medicare Ambulance",
            "Asiri Health Emergency Service",
            "Durdans Hospital Ambulance",
            "Red Cross Sri Lanka",
          ],
        }),
      },
    },
    ambulance: {
      columns: {
        currentLocation: f.point({
          minXValue: 79.81,
          maxXValue: 79.95,
          minYValue: 6.83,
          maxYValue: 6.98,
        }),
      },
    },
    hospitals: {
      count: 15,
      columns: {
        name: f.valuesFromArray({
          values: [
            "National Hospital of Sri Lanka",
            "Colombo South Teaching Hospital (Kalubowila)",
            "Colombo North Teaching Hospital (Ragama)",
            "Lady Ridgeway Hospital for Children",
            "Castle Street Hospital for Women",
            "Sri Jayewardenepura General Hospital",
            "Lanka Hospitals",
            "Asiri Central Hospital",
            "Asiri Surgical Hospital",
            "Nawaloka Hospital Colombo",
            "Durdans Hospital",
            "Kings Hospital Colombo",
            "Hemas Hospital Thalawathugoda",
            "Ninewells Hospital",
            "Western Hospital Colombo",
          ],
        }),
        location: f.point({
          minXValue: 79.81,
          maxXValue: 79.95,
          minYValue: 6.83,
          maxYValue: 6.98,
        }),
      },
    },
    bookings: {
      columns: {
        pickupLocation: f.point({
          minXValue: 79.81,
          maxXValue: 79.95,
          minYValue: 6.83,
          maxYValue: 6.98,
        }),
      },
    },
  }));

  await db.execute(
    sql`UPDATE users SET current_location = ST_SetSRID(current_location, 4326) WHERE ST_SRID(current_location) = 0`
  );
  await db.execute(
    sql`UPDATE ambulances SET current_location = ST_SetSRID(current_location, 4326) WHERE ST_SRID(current_location) = 0`
  );
  await db.execute(
    sql`UPDATE hospitals SET location = ST_SetSRID(location, 4326) WHERE ST_SRID(location) = 0;`
  );
  await db.execute(
    sql`UPDATE bookings SET pickup_location = ST_SetSRID(pickup_location, 4326) WHERE ST_SRID(pickup_location) = 0`
  );

  console.log("DONE!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
