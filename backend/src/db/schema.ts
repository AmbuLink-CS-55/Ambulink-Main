import {
  pgTable,
  serial,
  text,
  varchar,
  timestamp,
  integer,
  foreignKey,
  pgEnum,
} from "drizzle-orm/pg-core";

export const ambulanceStatusEnum = pgEnum("ambulance_status", [
  "available",
  "in_transit",
  "unavailable",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "requested",
  "accepted",
  "in_transit",
  "arrived",
  "completed",
]);

export const service = pgTable("service", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const user = pgTable("user", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  address: text("address"),
});

export const driver = pgTable(
  "driver",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    serviceId: integer("service_id").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    license: varchar("license", { length: 50 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.serviceId], foreignColumns: [service.id] }),
  ]
);

export const emt = pgTable(
  "emt",
  {
    id: serial("id").primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    serviceId: integer("service_id").notNull(),
    phone: varchar("phone", { length: 20 }).notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.serviceId], foreignColumns: [service.id] }),
  ]
);

export const ambulance = pgTable(
  "ambulance",
  {
    id: serial("id").primaryKey(),
    plate: varchar("plate", { length: 20 }).notNull().unique(),
    serviceId: integer("service_id").notNull(),
    status: ambulanceStatusEnum("status").default("available").notNull(),
    driverId: integer("driver_id"),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    foreignKey({ columns: [table.serviceId], foreignColumns: [service.id] }),
    foreignKey({ columns: [table.driverId], foreignColumns: [driver.id] }),
  ]
);

// for done rides
export const ambulanceride = pgTable(
  "ambulance_ride",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull(),
    ambulanceId: integer("ambulance_id").notNull(),
    hospitalId: integer("hospital_id"),
    dispatcherId: integer("dispatcher_id"),
    pickupLocation: text("pickup_location").notNull(),
    dropoffLocation: text("dropoff_location").notNull(),
    status: requestStatusEnum("status").default("requested").notNull(),
    rating: integer("rating"),
    createdAt: timestamp("created_at").defaultNow(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    foreignKey({ columns: [table.userId], foreignColumns: [user.id] }),
    foreignKey({
      columns: [table.ambulanceId],
      foreignColumns: [ambulance.id],
    }),
    foreignKey({ columns: [table.dispatcherId], foreignColumns: [driver.id] }),
  ]
);
