import { INestApplication } from "@nestjs/common";
import { and, eq, inArray } from "drizzle-orm";

import { DbService } from "../../src/core/database/db.service";
import { USER_SEED_IDS } from "../../src/core/database/seed/seed-ids";
import { bookings, hospitals, users } from "../../src/core/database/schema";
import { signAuthToken } from "../../src/common/auth/auth-token";
import { BookingCoreService } from "../../src/modules/booking/common/booking.core.service";
import { DriverEventsService } from "../../src/modules/driver/events/driver.events.service";
import { EmtEventsService } from "../../src/modules/emt/events/emt.events.service";
import { PatientEventsService } from "../../src/modules/patient/events/patient.events.service";
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

type ActorKey = "patient" | "driverOne" | "driverTwo" | "dispatcher" | "emt";

describe("Booking lifecycle scenarios", () => {
  let app: INestApplication;
  let dbService: DbService;
  let bookingCoreService: BookingCoreService;
  let driverEventsService: DriverEventsService;
  let emtEventsService: EmtEventsService;
  let patientEventsService: PatientEventsService;
  let baseUrl: string;

  beforeEach(async () => {
    const seeded = await createSeededApp();
    app = seeded.app;
    dbService = seeded.dbService;
    await ensurePatientUser();
    bookingCoreService = app.get(BookingCoreService);
    driverEventsService = app.get(DriverEventsService);
    emtEventsService = app.get(EmtEventsService);
    patientEventsService = app.get(PatientEventsService);
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it(
    "assign -> arrived -> completed",
    async () => {
      const timeline = new ScenarioTimeline();
      const expectations: ScenarioExpectationResult[] = [];
      const tokens = await createActorTokens();

      const patientSocket = connectActorSocket(
        baseUrl,
        "patient",
        USER_SEED_IDS.patientPrimary,
        tokens.patient
      );
      const driverSocket = connectActorSocket(
        baseUrl,
        "driver",
        USER_SEED_IDS.driverOne,
        tokens.driverOne
      );
      const dispatcherSocket = connectActorSocket(
        baseUrl,
        "dispatcher",
        USER_SEED_IDS.dispatcherOne,
        tokens.dispatcher
      );
      const emtSocket = connectActorSocket(baseUrl, "emt", USER_SEED_IDS.emtOne, tokens.emt);
      const sockets = [patientSocket, driverSocket, dispatcherSocket, emtSocket];

      const record = (
        actor: "patient" | "driver" | "dispatcher" | "emt",
        event: string,
        payload: unknown
      ) => timeline.add({ actor, channel: "socket", event, payload });

      patientSocket.on("booking:assigned", (payload) => record("patient", "booking:assigned", payload));
      patientSocket.on("booking:arrived", (payload) => record("patient", "booking:arrived", payload));
      patientSocket.on("booking:completed", (payload) => record("patient", "booking:completed", payload));

      driverSocket.on("booking:assigned", (payload) => record("driver", "booking:assigned", payload));
      driverSocket.on("booking:completed", (payload) => record("driver", "booking:completed", payload));

      dispatcherSocket.on("booking:assigned", (payload) =>
        record("dispatcher", "booking:assigned", payload)
      );
      dispatcherSocket.on("booking:update", (payload) =>
        record("dispatcher", "booking:update", payload)
      );

      emtSocket.on("booking:assigned", (payload) => record("emt", "booking:assigned", payload));
      emtSocket.on("booking:arrived", (payload) => record("emt", "booking:arrived", payload));
      emtSocket.on("booking:completed", (payload) => record("emt", "booking:completed", payload));

      try {
        await Promise.all(sockets.map((socket) => waitForSocketConnected(socket)));

        const bookingId = await assignSimpleBooking();
        await emtEventsService.subscribeToBooking(USER_SEED_IDS.emtOne, bookingId);

        await driverEventsService.arrived(USER_SEED_IDS.driverOne);
        await driverEventsService.completed(USER_SEED_IDS.driverOne);

        await delay(350);

        const [booking] = await dbService.db
          .select({ id: bookings.id, status: bookings.status, ongoing: bookings.ongoing })
          .from(bookings)
          .where(eq(bookings.id, bookingId));

        expectations.push({
          name: "booking completed",
          pass: booking?.status === "COMPLETED" && booking.ongoing === false,
          diagnostics: JSON.stringify(booking ?? null),
        });
        expectations.push({ name: "patient assigned", pass: timeline.has("patient", "booking:assigned") });
        expectations.push({ name: "patient arrived", pass: timeline.has("patient", "booking:arrived") });
        expectations.push({ name: "patient completed", pass: timeline.has("patient", "booking:completed") });
        expectations.push({ name: "driver assigned", pass: timeline.has("driver", "booking:assigned") });
        expectations.push({ name: "driver completed", pass: timeline.has("driver", "booking:completed") });
        expectations.push({ name: "dispatcher assigned", pass: timeline.has("dispatcher", "booking:assigned") });
        expectations.push({ name: "dispatcher update", pass: timeline.has("dispatcher", "booking:update") });
        expectations.push({ name: "emt assigned", pass: timeline.has("emt", "booking:assigned") });
        expectations.push({ name: "emt arrived", pass: timeline.has("emt", "booking:arrived") });
        expectations.push({ name: "emt completed", pass: timeline.has("emt", "booking:completed") });
      } finally {
        await closeSockets(sockets);
      }

      assertExpectations(expectations);
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "booking cancelled",
    async () => {
      const timeline = new ScenarioTimeline();
      const expectations: ScenarioExpectationResult[] = [];
      const tokens = await createActorTokens();

      const patientSocket = connectActorSocket(
        baseUrl,
        "patient",
        USER_SEED_IDS.patientPrimary,
        tokens.patient
      );
      const driverSocket = connectActorSocket(
        baseUrl,
        "driver",
        USER_SEED_IDS.driverOne,
        tokens.driverOne
      );
      const dispatcherSocket = connectActorSocket(
        baseUrl,
        "dispatcher",
        USER_SEED_IDS.dispatcherOne,
        tokens.dispatcher
      );
      const emtSocket = connectActorSocket(baseUrl, "emt", USER_SEED_IDS.emtOne, tokens.emt);
      const sockets = [patientSocket, driverSocket, dispatcherSocket, emtSocket];

      const record = (
        actor: "patient" | "driver" | "dispatcher" | "emt",
        event: string,
        payload: unknown
      ) => timeline.add({ actor, channel: "socket", event, payload });

      patientSocket.on("booking:cancelled", (payload) => record("patient", "booking:cancelled", payload));
      driverSocket.on("booking:cancelled", (payload) => record("driver", "booking:cancelled", payload));
      emtSocket.on("booking:cancelled", (payload) => record("emt", "booking:cancelled", payload));

      try {
        await Promise.all(sockets.map((socket) => waitForSocketConnected(socket)));

        const bookingId = await assignSimpleBooking();
        await emtEventsService.subscribeToBooking(USER_SEED_IDS.emtOne, bookingId);
        await patientEventsService.cancel(USER_SEED_IDS.patientPrimary, { reason: "Changed mind" });

        await delay(350);

        const [booking] = await dbService.db
          .select({ id: bookings.id, status: bookings.status, ongoing: bookings.ongoing })
          .from(bookings)
          .where(eq(bookings.id, bookingId));

        const actorsToCheck = [USER_SEED_IDS.patientPrimary, USER_SEED_IDS.driverOne, USER_SEED_IDS.emtOne];
        const subscriptionRows = await dbService.db
          .select({ id: users.id, subscribedBookingId: users.subscribedBookingId })
          .from(users)
          .where(and(inArray(users.id, actorsToCheck), eq(users.subscribedBookingId, bookingId)));

        expectations.push({
          name: "booking cancelled",
          pass: booking?.status === "CANCELLED" && booking.ongoing === false,
          diagnostics: JSON.stringify(booking ?? null),
        });
        expectations.push({
          name: "subscriptions cleared",
          pass: subscriptionRows.length === 0,
          diagnostics: JSON.stringify(subscriptionRows),
        });
        expectations.push({ name: "patient cancel event", pass: timeline.has("patient", "booking:cancelled") });
        expectations.push({ name: "driver cancel event", pass: timeline.has("driver", "booking:cancelled") });
        expectations.push({ name: "emt cancel event", pass: timeline.has("emt", "booking:cancelled") });
      } finally {
        await closeSockets(sockets);
      }

      assertExpectations(expectations);
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "booking reassigned",
    async () => {
      const timeline = new ScenarioTimeline();
      const expectations: ScenarioExpectationResult[] = [];
      const tokens = await createActorTokens();

      const patientSocket = connectActorSocket(
        baseUrl,
        "patient",
        USER_SEED_IDS.patientPrimary,
        tokens.patient
      );
      const driverOneSocket = connectActorSocket(
        baseUrl,
        "driver",
        USER_SEED_IDS.driverOne,
        tokens.driverOne
      );
      const driverTwoSocket = connectActorSocket(
        baseUrl,
        "driver",
        USER_SEED_IDS.driverTwo,
        tokens.driverTwo
      );
      const dispatcherSocket = connectActorSocket(
        baseUrl,
        "dispatcher",
        USER_SEED_IDS.dispatcherOne,
        tokens.dispatcher
      );
      const emtSocket = connectActorSocket(baseUrl, "emt", USER_SEED_IDS.emtOne, tokens.emt);
      const sockets = [patientSocket, driverOneSocket, driverTwoSocket, dispatcherSocket, emtSocket];

      const record = (
        actor: "patient" | "driver" | "dispatcher" | "emt",
        event: string,
        payload: unknown
      ) => timeline.add({ actor, channel: "socket", event, payload });

      driverOneSocket.on("booking:cancelled", (payload) => record("driver", "booking:cancelled", payload));
      driverTwoSocket.on("booking:assigned", (payload) =>
        record("driver", "driver-two:booking:assigned", payload)
      );
      emtSocket.on("booking:assigned", (payload) => record("emt", "booking:assigned", payload));

      try {
        await Promise.all(sockets.map((socket) => waitForSocketConnected(socket)));

        const bookingId = await assignSimpleBooking();
        await emtEventsService.subscribeToBooking(USER_SEED_IDS.emtOne, bookingId);
        await bookingCoreService.reassignBooking(bookingId, USER_SEED_IDS.dispatcherOne, {
          driverId: USER_SEED_IDS.driverTwo,
        });

        await delay(350);

        const [booking] = await dbService.db
          .select({ id: bookings.id, driverId: bookings.driverId, status: bookings.status })
          .from(bookings)
          .where(eq(bookings.id, bookingId));

        expectations.push({
          name: "booking moved to driver two",
          pass: booking?.driverId === USER_SEED_IDS.driverTwo,
          diagnostics: JSON.stringify(booking ?? null),
        });
        expectations.push({ name: "old driver cancelled", pass: timeline.has("driver", "booking:cancelled") });
        expectations.push({
          name: "new driver assigned",
          pass: timeline.has("driver", "driver-two:booking:assigned"),
        });
        expectations.push({ name: "emt assigned emitted", pass: timeline.has("emt", "booking:assigned") });
      } finally {
        await closeSockets(sockets);
      }

      assertExpectations(expectations);
    },
    SCENARIO_TIMEOUT_MS
  );

  async function assignSimpleBooking() {
    const [hospital] = await dbService.db.select({ id: hospitals.id }).from(hospitals).limit(1);
    const result = await bookingCoreService.manualAssignBooking(USER_SEED_IDS.dispatcherOne, {
      patientId: USER_SEED_IDS.patientPrimary,
      driverId: USER_SEED_IDS.driverOne,
      hospitalId: hospital.id,
      pickupLocation: { x: 79.86, y: 6.92 },
    });

    if (!result.bookingId) {
      throw new Error("Booking assignment failed");
    }

    return result.bookingId;
  }

  async function ensurePatientUser() {
    const [existing] = await dbService.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, USER_SEED_IDS.patientPrimary));

    if (existing) {
      return;
    }

    await dbService.db.insert(users).values({
      id: USER_SEED_IDS.patientPrimary,
      fullName: "Test Patient",
      phoneNumber: "+94770009999",
      email: "patient.primary@example.com",
      passwordHash: "pw123456",
      role: "PATIENT",
      providerId: null,
      status: "OFFLINE",
      isActive: true,
      isDispatcherAdmin: false,
    });
  }

  async function createActorTokens() {
    return {
      patient: await createTokenForUser("patient"),
      driverOne: await createTokenForUser("driverOne"),
      driverTwo: await createTokenForUser("driverTwo"),
      dispatcher: await createTokenForUser("dispatcher"),
      emt: await createTokenForUser("emt"),
    };
  }

  async function createTokenForUser(actor: ActorKey) {
    const userId =
      actor === "patient"
        ? USER_SEED_IDS.patientPrimary
        : actor === "driverOne"
          ? USER_SEED_IDS.driverOne
          : actor === "driverTwo"
            ? USER_SEED_IDS.driverTwo
            : actor === "dispatcher"
              ? USER_SEED_IDS.dispatcherOne
              : USER_SEED_IDS.emtOne;

    const [user] = await dbService.db
      .select({
        id: users.id,
        role: users.role,
        providerId: users.providerId,
        email: users.email,
        fullName: users.fullName,
        isDispatcherAdmin: users.isDispatcherAdmin,
      })
      .from(users)
      .where(eq(users.id, userId));

    if (!user) {
      throw new Error(`Missing seeded user ${userId}`);
    }

    return signAuthToken(user).accessToken;
  }
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
