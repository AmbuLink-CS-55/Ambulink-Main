CREATE EXTENSION postgis;

CREATE TYPE "public"."ambulance_status" AS ENUM('AVAILABLE', 'BUSY', 'OFFLINE');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('REQUESTED', 'ASSIGNED', 'ARRIVED', 'PICKEDUP', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('PATIENT', 'DISPATCHER', 'DRIVER', 'EMT');--> statement-breakpoint
CREATE TABLE "ambulances" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"vehicle_number" varchar(100) NOT NULL,
	"equipment_level" varchar(100),
	"status" "ambulance_status" DEFAULT 'AVAILABLE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_update_time" timestamp with time zone,
	"current_location" geometry(point)
);
--> statement-breakpoint
CREATE TABLE "ambulance_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"provider_type" "provider_type" NOT NULL,
	"hotline_number" varchar(50),
	"address" varchar(500),
	"initial_price" numeric(12, 2),
	"price_per_km" numeric(12, 2),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bookings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid,
	"pickup_address" varchar(500) NOT NULL,
	"pickup_location" geometry(point),
	"status" "booking_status" DEFAULT 'REQUESTED' NOT NULL,
	"provider_id" uuid,
	"ambulance_id" uuid,
	"driver_id" uuid,
	"hospital_id" uuid,
	"emergency_type" varchar(100),
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"assigned_at" timestamp with time zone,
	"pickedup_at" timestamp with time zone,
	"arrived_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"fare_estimate" numeric(12, 2),
	"fare_final" numeric(12, 2),
	"cancellation_reason" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "helplines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone_number" varchar(50) NOT NULL,
	"description" varchar(1000),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hospitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"hospital_type" varchar(20) NOT NULL,
	"address" varchar(500),
	"phone_number" varchar(50),
	"location" geometry(point),
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" varchar(255),
	"phone_number" varchar(50),
	"email" varchar(255),
	"password_hash" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp with time zone,
	"role" "user_role" NOT NULL,
	"provider_id" uuid
);
--> statement-breakpoint
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ambulance_id_ambulances_id_fk" FOREIGN KEY ("ambulance_id") REFERENCES "public"."ambulances"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_number_unique" ON "ambulances" USING btree ("vehicle_number");--> statement-breakpoint
CREATE INDEX "provider_idx_ambulances" ON "ambulances" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "patient_idx" ON "bookings" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "status_idx" ON "bookings" USING btree ("status");--> statement-breakpoint
CREATE INDEX "provider_idx_bookings" ON "bookings" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "ambulance_idx" ON "bookings" USING btree ("ambulance_id");--> statement-breakpoint
CREATE INDEX "driver_idx" ON "bookings" USING btree ("driver_id");--> statement-breakpoint
CREATE INDEX "hospital_idx" ON "bookings" USING btree ("hospital_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_unique" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "provider_idx" ON "users" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "role_idx" ON "users" USING btree ("role");
