import { eq, and, sql } from "drizzle-orm";
import {
  users,
  ambulance,
  ambulanceProviders,
  hospitals,
  bookings,
} from "@/database/schema";
import type { DbService } from "@/database/db.service";

// ============================================
// 1. patient:help - Find nearest available drivers
// ============================================
export async function findNearestAvailableDrivers(
  db: DbService,
  lat: number,
  lng: number,
  radiusKm: number = 50,
  limit: number = 5
) {
  const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

  return db.getDb().execute(sql`
    SELECT
      u.id as driver_id,
      u.full_name,
      u.phone_number,
      u.provider_id,
      a.id as ambulance_id,
      a.vehicle_number,
      a.equipment_level,
      ST_X(a.current_location) as lng,
      ST_Y(a.current_location) as lat,
      ST_Distance(
        a.current_location::geography,
        ${point}::geography
      ) / 1000 as distance_km
    FROM users u
    INNER JOIN ambulances a ON a.provider_id = u.provider_id
    WHERE u.role = 'DRIVER'
      AND u.is_active = true
      AND a.status = 'AVAILABLE'
      AND a.current_location IS NOT NULL
      AND ST_DWithin(
        a.current_location::geography,
        ${point}::geography,
        ${radiusKm * 1000}
      )
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `);
}

// ============================================
// 2. booking:assigned - Get full booking response data
// ============================================
export async function getPatientData(db: DbService, patientId: string) {
  const result = await db
    .getDb()
    .select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      fullName: users.fullName,
    })
    .from(users)
    .where(eq(users.id, patientId));

  return result[0] ?? null;
}

export async function getDriverWithProvider(db: DbService, driverId: string) {
  const result = await db
    .getDb()
    .select({
      id: users.id,
      phoneNumber: users.phoneNumber,
      fullName: users.fullName,
      providerId: ambulanceProviders.id,
      providerName: ambulanceProviders.name,
    })
    .from(users)
    .innerJoin(ambulanceProviders, eq(users.providerId, ambulanceProviders.id))
    .where(and(eq(users.id, driverId), eq(users.role, "DRIVER")));

  return result[0] ?? null;
}

export async function getAmbulanceWithLocation(
  db: DbService,
  ambulanceId: string
) {
  const result = await db.getDb().execute(sql`
    SELECT
      id,
      vehicle_number,
      equipment_level,
      status,
      ST_X(current_location) as lng,
      ST_Y(current_location) as lat
    FROM ambulances
    WHERE id = ${ambulanceId}
  `);

  return result[0] ?? null;
}

export async function findNearestHospital(
  db: DbService,
  lat: number,
  lng: number
) {
  const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

  const result = await db.getDb().execute(sql`
    SELECT
      id,
      name,
      phone_number,
      address,
      hospital_type,
      ST_X(location) as lng,
      ST_Y(location) as lat,
      ST_Distance(
        location::geography,
        ${point}::geography
      ) / 1000 as distance_km
    FROM hospitals
    WHERE is_active = true
      AND location IS NOT NULL
    ORDER BY location <-> ${point}
    LIMIT 1
  `);

  return result[0] ?? null;
}

// Full booking response builder
export async function buildBookingAssignedResponse(
  db: DbService,
  params: {
    patientId: string;
    pickupLat: number;
    pickupLng: number;
    driverId: string;
    ambulanceId: string;
  }
) {
  const [patient, driver, ambulanceData, hospital] = await Promise.all([
    getPatientData(db, params.patientId),
    getDriverWithProvider(db, params.driverId),
    getAmbulanceWithLocation(db, params.ambulanceId),
    findNearestHospital(db, params.pickupLat, params.pickupLng),
  ]);

  if (!patient || !driver || !ambulanceData || !hospital) {
    return null;
  }

  return {
    patient: {
      id: patient.id,
      phone_number: patient.phoneNumber ?? "",
      name: patient.fullName,
      lat: params.pickupLat,
      lng: params.pickupLng,
    },
    driver: {
      id: driver.id,
      phone_number: driver.phoneNumber ?? "",
      lat: Number(ambulanceData.lat),
      lng: Number(ambulanceData.lng),
      ambulance_provider: {
        id: driver.providerId,
        name: driver.providerName,
      },
    },
    hospital: {
      id: hospital.id,
      name: hospital.name,
      phone_number: hospital.phone_number ?? "",
      lat: Number(hospital.lat),
      lng: Number(hospital.lng),
    },
  };
}

// ============================================
// 3. driver:update - Update ambulance location
// ============================================
export async function updateAmbulanceLocation(
  db: DbService,
  ambulanceId: string,
  lat: number,
  lng: number
) {
  const point = sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)`;

  return db.getDb().execute(sql`
    UPDATE ambulances
    SET
      current_location = ${point},
      last_update_time = NOW(),
      updated_at = NOW()
    WHERE id = ${ambulanceId}
  `);
}

// Get ambulance ID by driver ID
export async function getAmbulanceByDriver(db: DbService, driverId: string) {
  const result = await db
    .getDb()
    .select({ ambulanceId: ambulance.id })
    .from(ambulance)
    .innerJoin(users, eq(users.providerId, ambulance.providerId))
    .where(eq(users.id, driverId));

  return result[0]?.ambulanceId ?? null;
}

// ============================================
// 4. driver:arrived - Update booking status
// ============================================
export async function getActiveBookingByDriver(db: DbService, driverId: string) {
  const result = await db
    .getDb()
    .select({
      bookingId: bookings.id,
      patientId: bookings.patientId,
      status: bookings.status,
    })
    .from(bookings)
    .where(
      and(
        eq(bookings.driverId, driverId),
        sql`${bookings.status} IN ('ASSIGNED', 'ARRIVED', 'PICKEDUP')`
      )
    );

  return result[0] ?? null;
}

export async function markBookingArrived(db: DbService, bookingId: string) {
  return db
    .getDb()
    .update(bookings)
    .set({
      status: "ARRIVED",
      arrivedAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();
}

// ============================================
// 5. driver:pickedup - Mark patient picked up
// ============================================
export async function markBookingPickedUp(db: DbService, bookingId: string) {
  return db
    .getDb()
    .update(bookings)
    .set({
      status: "PICKEDUP",
      pickedupAt: new Date(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();
}

// ============================================
// 6. driver:completed - Complete booking
// ============================================
export async function markBookingCompleted(
  db: DbService,
  bookingId: string,
  fareFinal?: number
) {
  return db
    .getDb()
    .update(bookings)
    .set({
      status: "COMPLETED",
      completedAt: new Date(),
      fareFinal: fareFinal?.toString(),
    })
    .where(eq(bookings.id, bookingId))
    .returning();
}

export async function setAmbulanceAvailable(db: DbService, ambulanceId: string) {
  return db
    .getDb()
    .update(ambulance)
    .set({
      status: "AVAILABLE",
      updatedAt: new Date(),
    })
    .where(eq(ambulance.id, ambulanceId));
}

// ============================================
// Create booking record
// ============================================
export async function createBookingRecord(
  db: DbService,
  params: {
    patientId: string;
    pickupLat: number;
    pickupLng: number;
    pickupAddress: string;
    providerId: string;
    ambulanceId: string;
    driverId: string;
    hospitalId: string;
    emergencyType?: string;
    fareEstimate?: number;
  }
) {
  const pickupPoint = sql`ST_SetSRID(ST_MakePoint(${params.pickupLng}, ${params.pickupLat}), 4326)`;

  const result = await db.getDb().execute(sql`
    INSERT INTO bookings (
      patient_id,
      pickup_address,
      pickup_location,
      status,
      provider_id,
      ambulance_id,
      driver_id,
      hospital_id,
      emergency_type,
      fare_estimate,
      requested_at,
      assigned_at
    ) VALUES (
      ${params.patientId},
      ${params.pickupAddress},
      ${pickupPoint},
      'ASSIGNED',
      ${params.providerId},
      ${params.ambulanceId},
      ${params.driverId},
      ${params.hospitalId},
      ${params.emergencyType ?? null},
      ${params.fareEstimate ?? null},
      NOW(),
      NOW()
    )
    RETURNING *
  `);

  return result[0];
}

// ============================================
// Fare calculation helper
// ============================================
export async function calculateFareEstimate(
  db: DbService,
  providerId: string,
  pickupLat: number,
  pickupLng: number,
  hospitalLat: number,
  hospitalLng: number
) {
  const result = await db.getDb().execute(sql`
    SELECT
      ap.initial_price,
      ap.price_per_km,
      ST_Distance(
        ST_SetSRID(ST_MakePoint(${pickupLng}, ${pickupLat}), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${hospitalLng}, ${hospitalLat}), 4326)::geography
      ) / 1000 as distance_km
    FROM ambulance_providers ap
    WHERE ap.id = ${providerId}
  `);

  const row = result[0] as any;
  if (!row) return null;

  const initialPrice = parseFloat(row.initial_price) || 0;
  const pricePerKm = parseFloat(row.price_per_km) || 0;
  const distanceKm = parseFloat(row.distance_km) || 0;

  return initialPrice + pricePerKm * distanceKm;
}
