// src/db/seed.ts
import * as schema from "@/database/schema";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

const client = postgres(
  process.env.DATABASE_URL ||
    "postgresql://postgres:123@localhost:5432/postgres",
  { prepare: false }
);
const db = drizzle(client, { schema });

async function seed() {
  console.log("Seeding database...");

  // Clear existing data (reverse order of dependencies)
  await db.delete(schema.bookings);
  await db.delete(schema.ambulance);
  await db.delete(schema.users);
  await db.delete(schema.hospitals);
  await db.delete(schema.helplines);
  await db.delete(schema.ambulanceProviders);

  // 1. Ambulance Providers
  const providers = await db
    .insert(schema.ambulanceProviders)
    .values([
      {
        name: "1990 Suwa Seriya",
        providerType: "PUBLIC",
        hotlineNumber: "1990",
        address: "415 Kotte Road, Rajagiriya",
        initialPrice: "0.00",
        pricePerKm: "0.00",
      },
      {
        name: "Lanka Hospitals Ambulance",
        providerType: "PRIVATE",
        hotlineNumber: "011-5430000",
        address: "578 Elvitigala Mawatha, Colombo 05",
        initialPrice: "2500.00",
        pricePerKm: "150.00",
      },
      {
        name: "Nawaloka Ambulance Service",
        providerType: "PRIVATE",
        hotlineNumber: "011-5577111",
        address: "23 Deshamanya H.K. Dharmadasa Mawatha, Colombo 02",
        initialPrice: "2000.00",
        pricePerKm: "120.00",
      },
      {
        name: "Asiri Ambulance Service",
        providerType: "PRIVATE",
        hotlineNumber: "011-4523300",
        address: "181 Kirula Road, Colombo 05",
        initialPrice: "3000.00",
        pricePerKm: "180.00",
      },
    ])
    .returning();

  // 2. Hospitals
  const hospitals = await db
    .insert(schema.hospitals)
    .values([
      {
        name: "National Hospital of Sri Lanka",
        hospitalType: "PUBLIC",
        address: "Regent Street, Colombo 10",
        phoneNumber: "011-2691111",
        location: sql`ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)`,
      },
      {
        name: "Teaching Hospital Karapitiya",
        hospitalType: "PUBLIC",
        address: "Karapitiya, Galle",
        phoneNumber: "091-2232276",
        location: sql`ST_SetSRID(ST_MakePoint(80.2209, 6.0535), 4326)`,
      },
      {
        name: "Teaching Hospital Kandy",
        hospitalType: "PUBLIC",
        address: "William Gopallawa Mawatha, Kandy",
        phoneNumber: "081-2222261",
        location: sql`ST_SetSRID(ST_MakePoint(80.6350, 7.2906), 4326)`,
      },
      {
        name: "Teaching Hospital Jaffna",
        hospitalType: "PUBLIC",
        address: "Hospital Road, Jaffna",
        phoneNumber: "021-2222261",
        location: sql`ST_SetSRID(ST_MakePoint(80.0255, 9.6615), 4326)`,
      },
      {
        name: "Lanka Hospitals",
        hospitalType: "PRIVATE",
        address: "578 Elvitigala Mawatha, Colombo 05",
        phoneNumber: "011-5430000",
        location: sql`ST_SetSRID(ST_MakePoint(79.8773, 6.8942), 4326)`,
      },
      {
        name: "Asiri Central Hospital",
        hospitalType: "PRIVATE",
        address: "114 Norris Canal Road, Colombo 10",
        phoneNumber: "011-4660000",
        location: sql`ST_SetSRID(ST_MakePoint(79.8580, 6.9298), 4326)`,
      },
      {
        name: "Nawaloka Hospital",
        hospitalType: "PRIVATE",
        address: "23 Deshamanya H.K. Dharmadasa Mawatha, Colombo 02",
        phoneNumber: "011-5577111",
        location: sql`ST_SetSRID(ST_MakePoint(79.8497, 6.9344), 4326)`,
      },
      {
        name: "District General Hospital Matara",
        hospitalType: "PUBLIC",
        address: "Matara",
        phoneNumber: "041-2222261",
        location: sql`ST_SetSRID(ST_MakePoint(80.5353, 5.9485), 4326)`,
      },
    ])
    .returning();

  // 3. Helplines
  await db.insert(schema.helplines).values([
    {
      name: "Suwa Seriya (Ambulance)",
      phoneNumber: "1990",
      description: "Free national ambulance service",
    },
    {
      name: "Police Emergency",
      phoneNumber: "119",
      description: "Sri Lanka Police emergency",
    },
    {
      name: "Fire & Rescue",
      phoneNumber: "110",
      description: "Fire and rescue services",
    },
    {
      name: "Accident Service - National Hospital",
      phoneNumber: "011-2691111",
      description: "National Hospital Colombo accident service",
    },
    {
      name: "Government Information Center",
      phoneNumber: "1919",
      description: "Government services hotline",
    },
  ]);

  // 4. Users (non-driver/EMT)
  const createdUsers = await db
    .insert(schema.users)
    .values([
      {
        fullName: "Kumara Perera",
        phoneNumber: "+94771234567",
        email: "dispatcher1@suwaseriya.lk",
        passwordHash: "$2b$10$hashedpassword1",
        role: "DISPATCHER",
        providerId: providers[0].id,
        status: "AVAILABLE",
      },
      {
        fullName: "Malini Silva",
        phoneNumber: "+94771234568",
        email: "dispatcher2@lanka.lk",
        passwordHash: "$2b$10$hashedpassword8",
        role: "DISPATCHER",
        providerId: providers[1].id,
        status: "AVAILABLE",
      },
      {
        fullName: "John Smith",
        phoneNumber: "+94775678901",
        email: "john@email.com",
        passwordHash: "$2b$10$hashedpassword5",
        role: "PATIENT",
      },
      {
        fullName: "Sarah Johnson",
        phoneNumber: "+94776789012",
        email: "sarah@email.com",
        passwordHash: "$2b$10$hashedpassword6",
        role: "PATIENT",
      },
      {
        fullName: "Mike Chen",
        phoneNumber: "+94777890123",
        email: "mike@email.com",
        passwordHash: "$2b$10$hashedpassword7",
        role: "PATIENT",
      },
    ])
    .returning();

  // 5. Drivers/EMTs (with location via raw SQL)
  const driverRows = await db.execute<{ id: string }>(sql`
    INSERT INTO users (full_name, phone_number, email, password_hash, role, provider_id, status, current_location, last_location_update)
    VALUES
      ('Nimal Fernando', '+94772345678', 'driver1@suwaseriya.lk', '$2b$10$hashedpassword2', 'DRIVER', ${providers[0].id}, 'OFFLINE', ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326), NOW()),
      ('Sunil Jayawardena', '+94773456789', 'driver2@lanka.lk', '$2b$10$hashedpassword3', 'DRIVER', ${providers[1].id}, 'OFFLINE', ST_SetSRID(ST_MakePoint(79.8773, 6.8942), 4326), NOW()),
      ('Ruwan Bandara', '+94772345679', 'driver3@suwaseriya.lk', '$2b$10$hashedpassword9', 'DRIVER', ${providers[0].id}, 'OFFLINE', ST_SetSRID(ST_MakePoint(80.6350, 7.2906), 4326), NOW()),
      ('Chaminda Silva', '+94774567890', 'emt1@suwaseriya.lk', '$2b$10$hashedpassword4', 'EMT', ${providers[0].id}, 'OFFLINE', ST_SetSRID(ST_MakePoint(79.8580, 6.9298), 4326), NOW())
    RETURNING id
  `);

  // 6. Ambulances
  const ambulances = await db
    .insert(schema.ambulance)
    .values([
      {
        providerId: providers[0].id,
        vehicleNumber: "WP-CAB-1990",
        equipmentLevel: "BLS",
        status: "AVAILABLE",
        currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8612, 6.9271), 4326)`,
        lastUpdateTime: new Date(),
      },
      {
        providerId: providers[0].id,
        vehicleNumber: "WP-CAC-1991",
        equipmentLevel: "ALS",
        status: "BUSY",
        currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8773, 6.8942), 4326)`,
        lastUpdateTime: new Date(),
      },
      {
        providerId: providers[1].id,
        vehicleNumber: "WP-LH-0001",
        equipmentLevel: "ALS",
        status: "AVAILABLE",
        currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8580, 6.9298), 4326)`,
        lastUpdateTime: new Date(),
      },
      {
        providerId: providers[2].id,
        vehicleNumber: "WP-NW-0001",
        equipmentLevel: "BLS",
        status: "OFFLINE",
        currentLocation: sql`ST_SetSRID(ST_MakePoint(79.8497, 6.9344), 4326)`,
        lastUpdateTime: new Date(),
      },
      {
        providerId: providers[0].id,
        vehicleNumber: "SP-CAB-1992",
        equipmentLevel: "ALS",
        status: "AVAILABLE",
        currentLocation: sql`ST_SetSRID(ST_MakePoint(80.6350, 7.2906), 4326)`,
        lastUpdateTime: new Date(),
      },
    ])
    .returning();

  // 7. Bookings
  const patients = createdUsers.filter((u) => u.role === "PATIENT");

  await db.insert(schema.bookings).values([
    {
      patientId: patients[0].id,
      pickupAddress: "42 Galle Road, Colombo 03",
      pickupLocation: sql`ST_SetSRID(ST_MakePoint(79.8485, 6.9147), 4326)`,
      status: "COMPLETED",
      providerId: providers[0].id,
      ambulanceId: ambulances[0].id,
      driverId: driverRows[0].id,
      hospitalId: hospitals[0].id,
      emergencyType: "CARDIAC",
      fareEstimate: "0.00",
      fareFinal: "0.00",
      assignedAt: new Date(Date.now() - 7200000),
      arrivedAt: new Date(Date.now() - 6000000),
      pickedupAt: new Date(Date.now() - 5400000),
      completedAt: new Date(Date.now() - 3600000),
    },
    {
      patientId: patients[1].id,
      pickupAddress: "15 Temple Road, Kandy",
      pickupLocation: sql`ST_SetSRID(ST_MakePoint(80.6337, 7.2916), 4326)`,
      status: "PICKEDUP",
      providerId: providers[1].id,
      ambulanceId: ambulances[2].id,
      driverId: driverRows[1].id,
      hospitalId: hospitals[2].id,
      emergencyType: "ACCIDENT",
      fareEstimate: "4500.00",
      assignedAt: new Date(Date.now() - 1800000),
      arrivedAt: new Date(Date.now() - 900000),
      pickedupAt: new Date(),
    },
    {
      patientId: patients[2].id,
      pickupAddress: "78 Main Street, Galle Fort",
      pickupLocation: sql`ST_SetSRID(ST_MakePoint(80.2170, 6.0267), 4326)`,
      status: "REQUESTED",
      emergencyType: "BREATHING",
    },
  ]);

  console.log("Seeding complete!");
}

seed()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => client.end());
