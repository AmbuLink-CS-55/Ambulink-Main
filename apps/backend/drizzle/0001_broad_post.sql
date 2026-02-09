CREATE TYPE "public"."user_status" AS ENUM('AVAILABLE', 'BUSY', 'OFFLINE');--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "pickup_address" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "current_location" geometry(point);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_location_update" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "status" "user_status";--> statement-breakpoint
CREATE INDEX "ambulance_status_location_idx" ON "ambulances" USING btree ("status","current_location");--> statement-breakpoint
CREATE INDEX "driver_status_location_idx" ON "users" USING btree ("role","is_active","status","current_location");