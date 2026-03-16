CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TYPE "public"."ambulance_status" AS ENUM('AVAILABLE', 'BUSY', 'OFFLINE');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('REQUESTED', 'ASSIGNED', 'ARRIVED', 'PICKEDUP', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."patient_guest_session_status" AS ENUM('ACTIVE', 'COMPLETED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."provider_type" AS ENUM('PUBLIC', 'PRIVATE');--> statement-breakpoint
CREATE TYPE "public"."staff_invite_role" AS ENUM('DISPATCHER', 'DRIVER', 'EMT');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('PATIENT', 'DISPATCHER', 'DRIVER', 'EMT');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('AVAILABLE', 'BUSY', 'OFFLINE');--> statement-breakpoint
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
	"pickup_address" varchar(500),
	"pickup_location" geometry(point),
	"status" "booking_status" DEFAULT 'REQUESTED' NOT NULL,
	"ongoing" boolean DEFAULT true NOT NULL,
	"provider_id" uuid,
	"ambulance_id" uuid,
	"driver_id" uuid,
	"emt_id" uuid,
	"dispatcher_id" uuid,
	"hospital_id" uuid,
	"emergency_type" varchar(100),
	"patient_profile_snapshot" jsonb,
	"emt_notes" jsonb DEFAULT '[]'::jsonb NOT NULL,
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
CREATE TABLE "dispatcher_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"invited_email" varchar(255),
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
CREATE TABLE "patient_guest_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"patient_id" uuid NOT NULL,
	"booking_id" uuid,
	"token_hash" varchar(128) NOT NULL,
	"status" "patient_guest_session_status" DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "staff_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code_hash" varchar(255) NOT NULL,
	"provider_id" uuid NOT NULL,
	"role" "staff_invite_role" NOT NULL,
	"username" varchar(100) NOT NULL,
	"full_name" varchar(255),
	"email" varchar(255),
	"phone_number" varchar(50),
	"created_by_dispatcher_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"max_attempts" integer DEFAULT 10 NOT NULL,
	"attempts_used" integer DEFAULT 0 NOT NULL,
	"invited_email" varchar(255),
	"token_hash" varchar(128) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"is_dispatcher_admin" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"role" "user_role" NOT NULL,
	"provider_id" uuid,
	"current_location" geometry(point),
	"last_location_update" timestamp with time zone,
	"status" "user_status",
	"subscribed_booking_id" uuid
);
--> statement-breakpoint
ALTER TABLE "ambulances" ADD CONSTRAINT "ambulances_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_ambulance_id_ambulances_id_fk" FOREIGN KEY ("ambulance_id") REFERENCES "public"."ambulances"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_driver_id_users_id_fk" FOREIGN KEY ("driver_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_emt_id_users_id_fk" FOREIGN KEY ("emt_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dispatcher_id_users_id_fk" FOREIGN KEY ("dispatcher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "public"."hospitals"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dispatcher_invites" ADD CONSTRAINT "dispatcher_invites_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "dispatcher_invites" ADD CONSTRAINT "dispatcher_invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient_guest_sessions" ADD CONSTRAINT "patient_guest_sessions_patient_id_users_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "patient_guest_sessions" ADD CONSTRAINT "patient_guest_sessions_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_created_by_dispatcher_id_users_id_fk" FOREIGN KEY ("created_by_dispatcher_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "staff_invites" ADD CONSTRAINT "staff_invites_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_provider_id_ambulance_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."ambulance_providers"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_subscribed_booking_id_bookings_id_fk" FOREIGN KEY ("subscribed_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "vehicle_number_unique" ON "ambulances" USING btree ("vehicle_number");--> statement-breakpoint
CREATE INDEX "provider_idx_ambulances" ON "ambulances" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "ambulance_status_location_idx" ON "ambulances" USING btree ("status","current_location");--> statement-breakpoint
CREATE INDEX "patient_status_idx" ON "bookings" USING btree ("patient_id","status");--> statement-breakpoint
CREATE INDEX "driver_status_idx" ON "bookings" USING btree ("driver_id","status");--> statement-breakpoint
CREATE INDEX "emt_status_idx" ON "bookings" USING btree ("emt_id","status");--> statement-breakpoint
CREATE INDEX "dispatcher_status_idx" ON "bookings" USING btree ("dispatcher_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "active_driver_booking_unique" ON "bookings" USING btree ("driver_id") WHERE "bookings"."status" in ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'PICKEDUP');--> statement-breakpoint
CREATE UNIQUE INDEX "dispatcher_invites_token_hash_unique" ON "dispatcher_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "dispatcher_invites_provider_idx" ON "dispatcher_invites" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "dispatcher_invites_invited_email_idx" ON "dispatcher_invites" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "dispatcher_invites_expires_at_idx" ON "dispatcher_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "patient_guest_sessions_token_hash_unique" ON "patient_guest_sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "patient_guest_sessions_patient_idx" ON "patient_guest_sessions" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "patient_guest_sessions_status_idx" ON "patient_guest_sessions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "patient_guest_sessions_expires_at_idx" ON "patient_guest_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "staff_invites_token_hash_unique" ON "staff_invites" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "staff_invites_provider_idx" ON "staff_invites" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "staff_invites_role_idx" ON "staff_invites" USING btree ("role");--> statement-breakpoint
CREATE INDEX "staff_invites_invited_email_idx" ON "staff_invites" USING btree ("invited_email");--> statement-breakpoint
CREATE INDEX "staff_invites_expires_at_idx" ON "staff_invites" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "phone_unique" ON "users" USING btree ("phone_number");--> statement-breakpoint
CREATE UNIQUE INDEX "email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "provider_idx" ON "users" USING btree ("provider_id");--> statement-breakpoint
CREATE INDEX "role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "subscribed_booking_idx" ON "users" USING btree ("subscribed_booking_id");--> statement-breakpoint
CREATE INDEX "driver_status_location_idx" ON "users" USING btree ("role","is_active","status","current_location");
