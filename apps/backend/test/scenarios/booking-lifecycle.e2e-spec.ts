import fs from "node:fs/promises";
import path from "node:path";
import request from "supertest";
import { INestApplication } from "@nestjs/common";
import { and, eq } from "drizzle-orm";

import { DbService } from "../../src/core/database/db.service";
import { USER_SEED_IDS } from "../../src/core/database/seed/seed-ids";
import { bookings, hospitals, users } from "../../src/core/database/schema";
import { createSeededApp } from "../helpers/e2e-app";
import {
  ScenarioExpectationResult,
  ScenarioTimeline,
  closeSockets,
  connectActorSocket,
  delay,
  waitForSocketConnected,
} from "../helpers/scenario";

const SCENARIO_TIMEOUT_MS = Number(process.env.SCENARIO_TIMEOUT_MS ?? 20000);
const STRICT_EVENT_ORDER = (process.env.SCENARIO_STRICT_EVENT_ORDER ?? "true") === "true";

describe("Booking lifecycle scenarios", () => {
  let app: INestApplication;
  let dbService: DbService;
  let baseUrl: string;

  beforeEach(async () => {
    const seeded = await createSeededApp();
    app = seeded.app;
    dbService = seeded.dbService;
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it(
    "happy path assign -> arrived -> completed",
    async () => {
      const timeline = new ScenarioTimeline();
      const expectations: ScenarioExpectationResult[] = [];

      const patientSocket = connectActorSocket(baseUrl, "patient", USER_SEED_IDS.patientPrimary);
      const driverSocket = connectActorSocket(baseUrl, "driver", USER_SEED_IDS.driverOne);
      const dispatcherSocket = connectActorSocket(baseUrl, "dispatcher", USER_SEED_IDS.dispatcherOne);
      const emtSocket = connectActorSocket(baseUrl, "emt", USER_SEED_IDS.emtOne);
      const sockets = [patientSocket, driverSocket, dispatcherSocket, emtSocket];

      const record = (actor: "patient" | "driver" | "dispatcher" | "emt", event: string, payload: unknown) =>
        timeline.add({ actor, channel: "socket", event, payload });

      patientSocket.on("booking:assigned", (payload) => record("patient", "booking:assigned", payload));
      patientSocket.on("booking:arrived", (payload) => record("patient", "booking:arrived", payload));
      patientSocket.on("booking:completed", (payload) => record("patient", "booking:completed", payload));

      driverSocket.on("booking:assigned", (payload) => record("driver", "booking:assigned", payload));
      driverSocket.on("booking:completed", (payload) => record("driver", "booking:completed", payload));
      driverSocket.on("booking:cancelled", (payload) => record("driver", "booking:cancelled", payload));

      dispatcherSocket.on("booking:assigned", (payload) => record("dispatcher", "booking:assigned", payload));
      dispatcherSocket.on("booking:update", (payload) => record("dispatcher", "booking:update", payload));

      emtSocket.on("booking:assigned", (payload) => record("emt", "booking:assigned", payload));
      emtSocket.on("booking:arrived", (payload) => record("emt", "booking:arrived", payload));
      emtSocket.on("booking:completed", (payload) => record("emt", "booking:completed", payload));

      try {
        await Promise.all(sockets.map((socket) => waitForSocketConnected(socket)));

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

        timeline.add({ actor: "system", channel: "http", event: "booking:manual-assign", payload: assignResponse.body });

        const bookingId: string = assignResponse.body.bookingId;

        await request(app.getHttpServer())
          .post("/api/emts/events/subscribe")
          .query({ emtId: USER_SEED_IDS.emtOne })
          .send({ bookingId })
          .expect(201);

        timeline.add({ actor: "system", channel: "http", event: "emt:subscribe", payload: { bookingId } });

        await request(app.getHttpServer())
          .post("/api/drivers/events/arrived")
          .query({ driverId: USER_SEED_IDS.driverOne })
          .expect(201);

        timeline.add({ actor: "system", channel: "http", event: "driver:arrived", payload: { bookingId } });

        await request(app.getHttpServer())
          .post("/api/drivers/events/completed")
          .query({ driverId: USER_SEED_IDS.driverOne })
          .expect(201);

        timeline.add({ actor: "system", channel: "http", event: "driver:completed", payload: { bookingId } });

        await delay(350);

        const [completedBooking] = await dbService.db
          .select({ id: bookings.id, status: bookings.status, ongoing: bookings.ongoing })
          .from(bookings)
          .where(eq(bookings.id, bookingId));

        expectations.push({
          name: "booking transitions to completed",
          pass: completedBooking?.status === "COMPLETED" && completedBooking.ongoing === false,
          diagnostics: JSON.stringify(completedBooking ?? null),
        });

        expectations.push({ name: "patient receives assigned", pass: timeline.has("patient", "booking:assigned") });
        expectations.push({ name: "patient receives arrived", pass: timeline.has("patient", "booking:arrived") });
        expectations.push({ name: "patient receives completed", pass: timeline.has("patient", "booking:completed") });
        expectations.push({ name: "driver receives assigned", pass: timeline.has("driver", "booking:assigned") });
        expectations.push({ name: "emt receives assigned", pass: timeline.has("emt", "booking:assigned") });
        expectations.push({ name: "emt receives arrived", pass: timeline.has("emt", "booking:arrived") });
        expectations.push({ name: "emt receives completed", pass: timeline.has("emt", "booking:completed") });

        if (STRICT_EVENT_ORDER) {
          const patientEvents = timeline.all
            .filter((entry) => entry.actor === "patient")
            .map((entry) => entry.event);
          const ordered =
            patientEvents.indexOf("booking:assigned") !== -1 &&
            patientEvents.indexOf("booking:arrived") > patientEvents.indexOf("booking:assigned") &&
            patientEvents.indexOf("booking:completed") > patientEvents.indexOf("booking:arrived");
          expectations.push({
            name: "patient event order",
            pass: ordered,
            diagnostics: patientEvents.join(" -> "),
          });
        }
      } finally {
        const timelinePath = await timeline.flush("scenario-happy-path.timeline.json");
        await writeSummary("scenario-happy-path.summary.json", expectations);
        timeline.add({ actor: "system", channel: "http", event: "timeline:flushed", payload: { timelinePath } });
        await closeSockets(sockets);
      }

      assertExpectations(expectations);
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "patient cancellation clears subscriptions and emits cancel",
    async () => {
      const timeline = new ScenarioTimeline();
      const expectations: ScenarioExpectationResult[] = [];

      const patientSocket = connectActorSocket(baseUrl, "patient", USER_SEED_IDS.patientPrimary);
      const driverSocket = connectActorSocket(baseUrl, "driver", USER_SEED_IDS.driverOne);
      const dispatcherSocket = connectActorSocket(baseUrl, "dispatcher", USER_SEED_IDS.dispatcherOne);
      const emtSocket = connectActorSocket(baseUrl, "emt", USER_SEED_IDS.emtOne);
      const sockets = [patientSocket, driverSocket, dispatcherSocket, emtSocket];

      const record = (actor: "patient" | "driver" | "dispatcher" | "emt", event: string, payload: unknown) =>
        timeline.add({ actor, channel: "socket", event, payload });

      driverSocket.on("booking:cancelled", (payload) => record("driver", "booking:cancelled", payload));
      patientSocket.on("booking:cancelled", (payload) => record("patient", "booking:cancelled", payload));
      emtSocket.on("booking:cancelled", (payload) => record("emt", "booking:cancelled", payload));

      try {
        await Promise.all(sockets.map((socket) => waitForSocketConnected(socket)));

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
          .post("/api/emts/events/subscribe")
          .query({ emtId: USER_SEED_IDS.emtOne })
          .send({ bookingId })
          .expect(201);

        await request(app.getHttpServer())
          .post("/api/patients/events/cancel")
          .query({ patientId: USER_SEED_IDS.patientPrimary })
          .send({ reason: "Changed mind" })
          .expect(201);

        await delay(350);

        const [cancelledBooking] = await dbService.db
          .select({ id: bookings.id, status: bookings.status, ongoing: bookings.ongoing })
          .from(bookings)
          .where(eq(bookings.id, bookingId));

        expectations.push({
          name: "booking transitions to cancelled",
          pass: cancelledBooking?.status === "CANCELLED" && cancelledBooking.ongoing === false,
          diagnostics: JSON.stringify(cancelledBooking ?? null),
        });

        const subscriptions = await dbService.db
          .select({ id: users.id, subscribedBookingId: users.subscribedBookingId })
          .from(users)
          .where(
            and(
              eq(users.id, USER_SEED_IDS.patientPrimary),
              eq(users.subscribedBookingId, bookingId)
            )
          );

        expectations.push({
          name: "patient subscription cleared",
          pass: subscriptions.length === 0,
        });
        expectations.push({ name: "driver receives cancel event", pass: timeline.has("driver", "booking:cancelled") });
        expectations.push({ name: "emt receives cancel event", pass: timeline.has("emt", "booking:cancelled") });
      } finally {
        await timeline.flush("scenario-cancel.timeline.json");
        await writeSummary("scenario-cancel.summary.json", expectations);
        await closeSockets(sockets);
      }

      assertExpectations(expectations);
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "reassignment notifies old and new driver",
    async () => {
      const timeline = new ScenarioTimeline();
      const expectations: ScenarioExpectationResult[] = [];

      await dbService.db
        .update(users)
        .set({ providerId: "2ec5e125-8e16-45ff-bc90-b7a4c4d79d11", status: "AVAILABLE" })
        .where(eq(users.id, USER_SEED_IDS.driverTwo));

      const patientSocket = connectActorSocket(baseUrl, "patient", USER_SEED_IDS.patientPrimary);
      const driverOneSocket = connectActorSocket(baseUrl, "driver", USER_SEED_IDS.driverOne);
      const driverTwoSocket = connectActorSocket(baseUrl, "driver", USER_SEED_IDS.driverTwo);
      const dispatcherSocket = connectActorSocket(baseUrl, "dispatcher", USER_SEED_IDS.dispatcherOne);
      const emtSocket = connectActorSocket(baseUrl, "emt", USER_SEED_IDS.emtOne);
      const sockets = [patientSocket, driverOneSocket, driverTwoSocket, dispatcherSocket, emtSocket];

      const record = (actor: "patient" | "driver" | "dispatcher" | "emt", event: string, payload: unknown) =>
        timeline.add({ actor, channel: "socket", event, payload });

      driverOneSocket.on("booking:cancelled", (payload) => record("driver", "booking:cancelled", payload));
      driverTwoSocket.on("booking:assigned", (payload) => record("driver", "driver-two:booking:assigned", payload));
      emtSocket.on("booking:assigned", (payload) => record("emt", "booking:assigned", payload));

      try {
        await Promise.all(sockets.map((socket) => waitForSocketConnected(socket)));

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
          .post("/api/emts/events/subscribe")
          .query({ emtId: USER_SEED_IDS.emtOne })
          .send({ bookingId })
          .expect(201);

        await request(app.getHttpServer())
          .patch(`/api/booking/${bookingId}/reassign`)
          .send({ dispatcherId: USER_SEED_IDS.dispatcherOne, driverId: USER_SEED_IDS.driverTwo })
          .expect(200);

        await delay(350);

        const [reassigned] = await dbService.db
          .select({ id: bookings.id, driverId: bookings.driverId, status: bookings.status })
          .from(bookings)
          .where(eq(bookings.id, bookingId));

        expectations.push({
          name: "booking assigned to new driver",
          pass: reassigned?.driverId === USER_SEED_IDS.driverTwo,
          diagnostics: JSON.stringify(reassigned ?? null),
        });
        expectations.push({ name: "old driver receives cancel", pass: timeline.has("driver", "booking:cancelled") });
        expectations.push({ name: "new driver receives assigned", pass: timeline.has("driver", "driver-two:booking:assigned") });
        expectations.push({ name: "emt receives assignment update", pass: timeline.has("emt", "booking:assigned") });
      } finally {
        await timeline.flush("scenario-reassign.timeline.json");
        await writeSummary("scenario-reassign.summary.json", expectations);
        await closeSockets(sockets);
      }

      assertExpectations(expectations);
    },
    SCENARIO_TIMEOUT_MS
  );
});

function assertExpectations(expectations: ScenarioExpectationResult[]) {
  const failed = expectations.filter((item) => !item.pass);
  if (failed.length > 0) {
    const detail = failed
      .map((item) => `${item.name}${item.diagnostics ? `: ${item.diagnostics}` : ""}`)
      .join("\n");
    throw new Error(`Scenario expectations failed:\n${detail}`);
  }
}

async function writeSummary(filename: string, summary: ScenarioExpectationResult[]) {
  const logDir = process.env.SCENARIO_LOG_DIR ?? path.resolve(process.cwd(), "test-results/scenario");
  await fs.mkdir(logDir, { recursive: true });
  await fs.writeFile(path.join(logDir, filename), JSON.stringify(summary, null, 2), "utf8");
}
