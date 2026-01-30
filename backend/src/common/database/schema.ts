import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  decimal,
  uniqueIndex,
  index,
  pgEnum,
  geometry,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "PATIENT",
  "DISPATCHER",
  "DRIVER",
  "EMT",
]);

export const userStatusEnum = pgEnum("user_status", [
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
]);

export const providerTypeEnum = pgEnum("provider_type", ["PUBLIC", "PRIVATE"]);

export const ambulanceStatusEnum = pgEnum("ambulance_status", [
  "AVAILABLE",
  "BUSY",
  "OFFLINE",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "REQUESTED",
  "ASSIGNED",
  "ARRIVED",
  "PICKEDUP",
  "COMPLETED",
  "CANCELLED",
]);

export const ambulanceProviders = pgTable("ambulance_providers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  providerType: providerTypeEnum("provider_type").notNull(),
  hotlineNumber: varchar("hotline_number", { length: 50 }),
  address: varchar("address", { length: 500 }),
  initialPrice: decimal("initial_price", { precision: 12, scale: 2 }),
  pricePerKm: decimal("price_per_km", { precision: 12, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fullName: varchar("full_name", { length: 255 }),
    phoneNumber: varchar("phone_number", { length: 50 }),
    email: varchar("email", { length: 255 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    isActive: boolean("is_active").notNull().default(true),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    role: userRoleEnum("role").notNull(),

    // FK (only for staff) - nullable
    providerId: uuid("provider_id").references(() => ambulanceProviders.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    // Location tracking for drivers
    currentLocation: geometry("current_location", {
      type: "point",
      mode: "xy",
      srid: 4326,
    }),
    lastLocationUpdate: timestamp("last_location_update", {
      withTimezone: true,
    }),

    // Status tracking for drivers
    status: userStatusEnum("status"),
  },
  (t) => ({
    phoneUnique: uniqueIndex("phone_unique").on(t.phoneNumber),
    emailUnique: uniqueIndex("email_unique").on(t.email),
    providerIdx: index("provider_idx").on(t.providerId),
    roleIdx: index("role_idx").on(t.role),
    driverStatusLocationIdx: index("driver_status_location_idx").on(
      t.role,
      t.isActive,
      t.status,
      t.currentLocation
    ),
  })
);

export const ambulance = pgTable(
  "ambulances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerId: uuid("provider_id")
      .notNull()
      .references(() => ambulanceProviders.id, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    vehicleNumber: varchar("vehicle_number", { length: 100 }).notNull(),
    equipmentLevel: varchar("equipment_level", { length: 100 }),
    status: ambulanceStatusEnum("status").notNull().default("AVAILABLE"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastUpdateTime: timestamp("last_update_time", { withTimezone: true }),
    currentLocation: geometry("current_location", {
      type: "point",
      mode: "xy",
      srid: 4326,
    }),
    // currentLatitude: decimal("current_latitude", { precision: 10, scale: 7 }),
    // currentLongitude: decimal("current_longitude", {
    //   precision: 10,
    //   scale: 7,
    // }),
  },
  (t) => ({
    vehicleNumberUnique: uniqueIndex("vehicle_number_unique").on(
      t.vehicleNumber
    ),
    providerIdx: index("provider_idx_ambulances").on(t.providerId),
    statusLocationIdx: index("ambulance_status_location_idx").on(
      t.status,
      t.currentLocation
    ),
  })
);

export const hospitals = pgTable("hospitals", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  hospitalType: varchar("hospital_type", { length: 20 }).notNull(), // or enum
  address: varchar("address", { length: 500 }),
  phoneNumber: varchar("phone_number", { length: 50 }),
  location: geometry("location", { type: "point", mode: "xy", srid: 4326 }),
  // latitude: decimal("latitude", { precision: 10, scale: 7 }),
  // longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isActive: boolean("is_active").notNull().default(true),
});

export const helplines = pgTable("helplines", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  description: varchar("description", { length: 1000 }),
  isActive: boolean("is_active").notNull().default(true),
});

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    patientId: uuid("patient_id").references(() => users.id, {
      onDelete: "restrict",
      onUpdate: "cascade",
    }),

    pickupAddress: varchar("pickup_address", { length: 500 }),
    pickupLocation: geometry("pickup_location", {
      type: "point",
      mode: "xy",
      srid: 4326,
    }),
    // pickupLatitude: decimal("pickup_latitude", { precision: 10, scale: 7 }),
    // pickupLongitude: decimal("pickup_longitude", { precision: 10, scale: 7 }),

    status: bookingStatusEnum("status").notNull().default("REQUESTED"),

    providerId: uuid("provider_id").references(() => ambulanceProviders.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    ambulanceId: uuid("ambulance_id").references(() => ambulance.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    driverId: uuid("driver_id").references(() => users.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    hospitalId: uuid("hospital_id").references(() => hospitals.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    emergencyType: varchar("emergency_type", { length: 100 }),

    requestedAt: timestamp("requested_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    assignedAt: timestamp("assigned_at", { withTimezone: true }),
    pickedupAt: timestamp("pickedup_at", { withTimezone: true }),
    arrivedAt: timestamp("arrived_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),

    fareEstimate: decimal("fare_estimate", { precision: 12, scale: 2 }),
    fareFinal: decimal("fare_final", { precision: 12, scale: 2 }),

    cancellationReason: varchar("cancellation_reason", { length: 500 }),
  },
  (t) => ({
    patientIdx: index("patient_idx").on(t.patientId),
    statusIdx: index("status_idx").on(t.status),
    providerIdx: index("provider_idx_bookings").on(t.providerId),
    ambulanceIdx: index("ambulance_idx").on(t.ambulanceId),
    driverIdx: index("driver_idx").on(t.driverId),
    hospitalIdx: index("hospital_idx").on(t.hospitalId),
  })
);

// Relations for quarying
export const ambulanceProvidersRelations = relations(
  ambulanceProviders,
  ({ many }) => ({
    users: many(users),
    ambulances: many(ambulance),
    bookings: many(bookings),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  provider: one(ambulanceProviders, {
    fields: [users.providerId],
    references: [ambulanceProviders.id],
  }),
  patientBookings: many(bookings, { relationName: "patientBookings" }),
  driverBookings: many(bookings, { relationName: "driverBookings" }),
}));

export const ambulancesRelations = relations(ambulance, ({ one, many }) => ({
  provider: one(ambulanceProviders, {
    fields: [ambulance.providerId],
    references: [ambulanceProviders.id],
  }),
  bookings: many(bookings),
}));

export const hospitalsRelations = relations(hospitals, ({ many }) => ({
  bookings: many(bookings),
}));

export const bookingsRelations = relations(bookings, ({ one }) => ({
  patient: one(users, {
    fields: [bookings.patientId],
    references: [users.id],
    relationName: "patientBookings",
  }),
  driver: one(users, {
    fields: [bookings.driverId],
    references: [users.id],
    relationName: "driverBookings",
  }),
  provider: one(ambulanceProviders, {
    fields: [bookings.providerId],
    references: [ambulanceProviders.id],
  }),
  ambulance: one(ambulance, {
    fields: [bookings.ambulanceId],
    references: [ambulance.id],
  }),
  hospital: one(hospitals, {
    fields: [bookings.hospitalId],
    references: [hospitals.id],
  }),
}));
