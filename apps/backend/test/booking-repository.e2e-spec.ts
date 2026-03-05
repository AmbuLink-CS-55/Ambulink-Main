import { INestApplication } from "@nestjs/common";

import { BookingRepository } from "../src/modules/booking/booking.repository";
import { DbService } from "../src/core/database/db.service";
import { USER_SEED_IDS } from "../src/core/database/seed/seed-ids";
import { hospitals } from "../src/core/database/schema";
import { createSeededApp } from "./helpers/e2e-app";

describe("BookingRepository (integration)", () => {
  let app: INestApplication;
  let repository: BookingRepository;
  let dbService: DbService;

  beforeEach(async () => {
    const seeded = await createSeededApp();
    app = seeded.app;
    dbService = seeded.dbService;
    repository = app.get(BookingRepository);
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it("sets, reads, and clears subscribed booking", async () => {
    const [hospital] = await dbService.db.select({ id: hospitals.id }).from(hospitals).limit(1);

    const [created] = await repository.createBooking({
      patientId: USER_SEED_IDS.patientPrimary,
      pickupAddress: "test",
      pickupLocation: { x: 79.86, y: 6.92 },
      providerId: "2ec5e125-8e16-45ff-bc90-b7a4c4d79d11",
      driverId: USER_SEED_IDS.driverOne,
      hospitalId: hospital.id,
      dispatcherId: USER_SEED_IDS.dispatcherOne,
      emergencyType: null,
    });

    expect(created?.id).toBeDefined();

    await repository.setUserSubscribedBooking(USER_SEED_IDS.emtOne, created.id);

    const [subscription] = await repository.getUserSubscribedBooking(USER_SEED_IDS.emtOne);
    expect(subscription?.subscribedBookingId).toBe(created.id);

    await repository.clearUserSubscribedBooking(USER_SEED_IDS.emtOne);
    const [cleared] = await repository.getUserSubscribedBooking(USER_SEED_IDS.emtOne);
    expect(cleared?.subscribedBookingId).toBeNull();
  });

  it("persists appended notes in jsonb", async () => {
    const [hospital] = await dbService.db.select({ id: hospitals.id }).from(hospitals).limit(1);

    const [created] = await repository.createBooking({
      patientId: USER_SEED_IDS.patientPrimary,
      pickupAddress: "test",
      pickupLocation: { x: 79.86, y: 6.92 },
      providerId: "2ec5e125-8e16-45ff-bc90-b7a4c4d79d11",
      driverId: USER_SEED_IDS.driverOne,
      hospitalId: hospital.id,
      dispatcherId: USER_SEED_IDS.dispatcherOne,
      emergencyType: null,
    });

    const note = {
      id: "note-1",
      bookingId: created.id,
      authorId: USER_SEED_IDS.emtOne,
      authorRole: "EMT" as const,
      content: "Vitals recorded",
      createdAt: new Date().toISOString(),
    };

    await repository.appendBookingNote(created.id, note);
    const [row] = await repository.getBookingDetailsRow(created.id);

    expect(Array.isArray(row?.notes)).toBe(true);
    expect((row?.notes as Array<{ id: string }>).some((entry) => entry.id === "note-1")).toBe(true);
  });
});
