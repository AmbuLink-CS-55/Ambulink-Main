import { INestApplication } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import request from "supertest";

import { createSeededApp } from "./helpers/e2e-app";
import { bookings, hospitals } from "../src/core/database/schema";
import { USER_SEED_IDS } from "../src/core/database/seed/seed-ids";
import type { DbService } from "../src/core/database/db.service";

describe("Booking details and notes (integration)", () => {
  let app: INestApplication;
  let dbService: DbService;

  beforeEach(async () => {
    const seeded = await createSeededApp();
    app = seeded.app;
    dbService = seeded.dbService;
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("allows same-provider dispatcher and blocks cross-provider", async () => {
    const [hospital] = await dbService.db.select({ id: hospitals.id }).from(hospitals).limit(1);

    const assignResponse = await request(app.getHttpServer())
      .post("/api/booking/manual-assign")
      .send({
        dispatcherId: USER_SEED_IDS.dispatcherOne,
        patientId: USER_SEED_IDS.patientPrimary,
        driverId: USER_SEED_IDS.driverOne,
        hospitalId: hospital.id,
        pickupLocation: { x: 79.86, y: 6.92 },
      })
      .expect(201);

    const bookingId: string = assignResponse.body.bookingId;

    await request(app.getHttpServer())
      .get(`/api/booking/${bookingId}/details`)
      .query({ dispatcherId: USER_SEED_IDS.dispatcherOne })
      .expect(200);

    await request(app.getHttpServer())
      .get(`/api/booking/${bookingId}/details`)
      .query({ dispatcherId: USER_SEED_IDS.dispatcherTwo })
      .expect(403);
  });

  it("appends notes via endpoint and returns in details", async () => {
    const [hospital] = await dbService.db.select({ id: hospitals.id }).from(hospitals).limit(1);

    const assignResponse = await request(app.getHttpServer())
      .post("/api/booking/manual-assign")
      .send({
        dispatcherId: USER_SEED_IDS.dispatcherOne,
        patientId: USER_SEED_IDS.patientPrimary,
        driverId: USER_SEED_IDS.driverOne,
        hospitalId: hospital.id,
        pickupLocation: { x: 79.86, y: 6.92 },
      })
      .expect(201);

    const bookingId: string = assignResponse.body.bookingId;

    await request(app.getHttpServer())
      .post(`/api/booking/${bookingId}/notes`)
      .send({
        dispatcherId: USER_SEED_IDS.dispatcherOne,
        content: "Dispatcher note for EMT",
      })
      .expect(201);

    const detailsResponse = await request(app.getHttpServer())
      .get(`/api/booking/${bookingId}/details`)
      .query({ dispatcherId: USER_SEED_IDS.dispatcherOne })
      .expect(200);

    expect(detailsResponse.body.notes.length).toBeGreaterThan(0);
    expect(detailsResponse.body.notes[0].content).toBe("Dispatcher note for EMT");

    const [saved] = await dbService.db
      .select({ id: bookings.id, notes: bookings.emtNotes })
      .from(bookings)
      .where(eq(bookings.id, bookingId));

    expect(saved).toBeDefined();
    expect(Array.isArray(saved?.notes)).toBe(true);
  });

  it("keeps booking scoped to active states for details-driven flows", async () => {
    const [hospital] = await dbService.db.select({ id: hospitals.id }).from(hospitals).limit(1);

    const assignResponse = await request(app.getHttpServer())
      .post("/api/booking/manual-assign")
      .send({
        dispatcherId: USER_SEED_IDS.dispatcherOne,
        patientId: USER_SEED_IDS.patientPrimary,
        driverId: USER_SEED_IDS.driverOne,
        hospitalId: hospital.id,
        pickupLocation: { x: 79.86, y: 6.92 },
      })
      .expect(201);

    const bookingId: string = assignResponse.body.bookingId;

    await request(app.getHttpServer())
      .post("/api/drivers/events/completed")
      .query({ driverId: USER_SEED_IDS.driverOne })
      .expect(201);

    const [booking] = await dbService.db
      .select({ id: bookings.id, status: bookings.status, ongoing: bookings.ongoing })
      .from(bookings)
      .where(and(eq(bookings.id, bookingId), eq(bookings.status, "COMPLETED")));

    expect(booking?.status).toBe("COMPLETED");
    expect(booking?.ongoing).toBe(false);
  });
});
