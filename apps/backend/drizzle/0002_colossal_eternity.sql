DROP INDEX "patient_idx";--> statement-breakpoint
DROP INDEX "status_idx";--> statement-breakpoint
DROP INDEX "provider_idx_bookings";--> statement-breakpoint
DROP INDEX "ambulance_idx";--> statement-breakpoint
DROP INDEX "driver_idx";--> statement-breakpoint
DROP INDEX "hospital_idx";--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "emt_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "dispatcher_id" uuid;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_emt_id_users_id_fk" FOREIGN KEY ("emt_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_dispatcher_id_users_id_fk" FOREIGN KEY ("dispatcher_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "patient_status_idx" ON "bookings" USING btree ("patient_id","status");--> statement-breakpoint
CREATE INDEX "driver_status_idx" ON "bookings" USING btree ("driver_id","status");--> statement-breakpoint
CREATE INDEX "emt_status_idx" ON "bookings" USING btree ("emt_id","status");--> statement-breakpoint
CREATE INDEX "dispatcher_status_idx" ON "bookings" USING btree ("dispatcher_id","status");