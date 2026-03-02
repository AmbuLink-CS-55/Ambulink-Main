CREATE UNIQUE INDEX IF NOT EXISTS "active_driver_booking_unique"
ON "bookings" ("driver_id")
WHERE "driver_id" IS NOT NULL
  AND "status" IN ('REQUESTED', 'ASSIGNED', 'ARRIVED', 'PICKEDUP');
