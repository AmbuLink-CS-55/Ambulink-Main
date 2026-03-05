ALTER TABLE "users" ADD COLUMN "subscribed_booking_id" uuid;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "patient_profile_snapshot" jsonb;
--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "emt_notes" jsonb DEFAULT '[]'::jsonb NOT NULL;
--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_subscribed_booking_id_bookings_id_fk" FOREIGN KEY ("subscribed_booking_id") REFERENCES "public"."bookings"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
CREATE INDEX "subscribed_booking_idx" ON "users" USING btree ("subscribed_booking_id");
