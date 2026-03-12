import { BookingCoreService } from "./common/booking.core.service";

describe("BookingCoreService reroute notifications", () => {
  const setup = () => {
    const tx = {
      update: jest.fn(),
    };

    const db = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([
            {
              id: "booking-1",
              providerId: "provider-1",
              dispatcherId: "dispatcher-1",
              status: "ASSIGNED",
              patientId: "patient-1",
              driverId: "driver-previous",
            },
          ]),
        })),
      })),
      transaction: jest.fn(async (callback) => callback(tx)),
    };

    const dbService = { db };

    const dispatcherService = {
      getDispatcherContextOrThrow: jest.fn().mockResolvedValue({
        id: "dispatcher-1",
        providerId: "provider-1",
      }),
      assertWithinProviderScope: jest.fn(),
      findAllLiveDispatchersByProvider: jest.fn().mockResolvedValue(["dispatcher-1", "dispatcher-2"]),
    };

    const bookingRepository = {
      setUserSubscribedBooking: jest.fn(),
      updateBooking: jest.fn(),
      getDriverActiveBooking: jest.fn().mockResolvedValue([]),
      clearUserSubscribedBooking: jest.fn(),
      getEmtsSubscribedToBooking: jest
        .fn()
        .mockResolvedValue([{ emtId: "emt-1" }, { emtId: "emt-2" }]),
    };

    const bookingMediaService = {
      bindPatientSessionToBooking: jest.fn(),
    };

    const driverService = {
      getDriverForProviderOrThrow: jest.fn().mockResolvedValue({ id: "driver-next" }),
      assertDriverNotBusy: jest.fn(),
      markBusy: jest.fn(),
      markAvailableIfNoActiveBookings: jest.fn(),
    };

    const patientService = {
      resolveOrCreateManualAssignmentPatient: jest.fn(),
      getPatientOrThrow: jest.fn(),
    };

    const hospitalService = {
      getByIdOrThrow: jest.fn(),
    };

    const emtService = {
      getEmtOrThrow: jest.fn(),
    };

    const eventBus = {
      publish: jest.fn(),
    };

    const service = new BookingCoreService(
      dbService as never,
      dispatcherService as never,
      eventBus as never,
      bookingRepository as never,
      bookingMediaService as never,
      driverService as never,
      patientService as never,
      hospitalService as never,
      emtService as never
    );

    jest.spyOn(service, "buildAssignedBookingPayload").mockResolvedValue({
      bookingId: "booking-1",
      status: "ASSIGNED",
      patient: { id: "patient-1", location: null, fullName: null, phoneNumber: null },
      driver: {
        id: "driver-next",
        fullName: null,
        phoneNumber: null,
        location: null,
        provider: null,
      },
      hospital: { id: "hospital-1", name: null, phoneNumber: null, location: null },
      provider: { id: "provider-1", name: "Provider", hotlineNumber: null },
      requestedAt: null,
      assignedAt: null,
      arrivedAt: null,
      pickedupAt: null,
      completedAt: null,
      pickupLocation: null,
      emtNotes: [],
      patientProfileSnapshot: null,
    });
    jest.spyOn(service, "buildDispatcherBookingPayload").mockResolvedValue({
      bookingId: "booking-1",
      status: "ASSIGNED",
      pickupLocation: null,
      patient: { id: "patient-1", fullName: null, phoneNumber: null, location: null },
      driver: {
        id: "driver-next",
        fullName: null,
        phoneNumber: null,
        location: null,
        provider: null,
      },
      hospital: { id: "hospital-1", name: null, phoneNumber: null, location: null },
      provider: { id: "provider-1", name: "Provider" },
    });

    return { service, eventBus };
  };

  it("emits booking:rerouted when reassignment changes route-affecting fields", async () => {
    const { service, eventBus } = setup();

    await service.reassignBooking("booking-1", "dispatcher-1", {
      dispatcherId: "dispatcher-1",
      driverId: "driver-next",
    });

    const reroutedEvents = eventBus.publish.mock.calls.filter(
      ([evt]) => evt.event === "booking:rerouted"
    );

    expect(reroutedEvents.length).toBeGreaterThan(0);
  });
});

describe("BookingCoreService analytics", () => {
  const setup = () => {
    const bookingRepository = {
      getBookingAnalyticsRows: jest.fn().mockResolvedValue([
        {
          bookingId: "b1",
          status: "COMPLETED",
          requestedAt: new Date("2026-03-01T10:00:00.000Z"),
          assignedAt: new Date("2026-03-01T10:02:00.000Z"),
          arrivedAt: new Date("2026-03-01T10:12:00.000Z"),
          pickedupAt: new Date("2026-03-01T10:20:00.000Z"),
          completedAt: new Date("2026-03-01T10:44:00.000Z"),
          cancellationReason: null,
          driverId: "driver-1",
          driverName: "Driver One",
          hospitalId: "h1",
          hospitalName: "General Hospital",
          pickupLocationX: 79.85,
          pickupLocationY: 6.92,
          hospitalLocationX: 79.88,
          hospitalLocationY: 6.95,
        },
        {
          bookingId: "b2",
          status: "CANCELLED",
          requestedAt: new Date("2026-03-02T09:00:00.000Z"),
          assignedAt: new Date("2026-03-02T09:03:00.000Z"),
          arrivedAt: null,
          pickedupAt: null,
          completedAt: null,
          cancellationReason: "Patient unavailable",
          driverId: "driver-2",
          driverName: "Driver Two",
          hospitalId: "h1",
          hospitalName: "General Hospital",
          pickupLocationX: 79.851,
          pickupLocationY: 6.921,
          hospitalLocationX: 79.88,
          hospitalLocationY: 6.95,
        },
      ]),
    };

    const dispatcherService = {
      getDispatcherContextOrThrow: jest.fn().mockResolvedValue({
        id: "dispatcher-1",
        providerId: "provider-1",
      }),
    };

    const service = new BookingCoreService(
      { db: {} } as never,
      dispatcherService as never,
      { publish: jest.fn() } as never,
      bookingRepository as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never
    );

    return { service, bookingRepository };
  };

  it("computes response analytics with transition durations and per-driver breakdown", async () => {
    const { service } = setup();

    const result = await service.getBookingResponseAnalytics("dispatcher-1");

    expect(result.totalBookings).toBe(2);
    expect(result.completedBookings).toBe(1);
    expect(result.cancelledBookings).toBe(1);
    expect(result.dispatchLatency.medianSeconds).toBe(150);
    expect(result.responseTime.count).toBe(1);
    expect(result.drivers.length).toBe(2);
    expect(result.drivers[0]?.driverName).toBe("Driver One");
  });

  it("passes range bounds into repository query", async () => {
    const { service, bookingRepository } = setup();
    const from = "2026-03-01T00:00:00.000Z";
    const to = "2026-03-05T00:00:00.000Z";

    await service.getBookingResponseAnalytics("dispatcher-1", from, to);

    expect(bookingRepository.getBookingAnalyticsRows).toHaveBeenCalledWith("provider-1", {
      from: new Date(from),
      to: new Date(to),
    });
  });

  it("aggregates zone grid counts", async () => {
    const { service } = setup();
    const zones = await service.getBookingZonesAnalytics("dispatcher-1");
    expect(zones.responseOrigins.length).toBeGreaterThan(0);
    expect(zones.responseOrigins[0]?.count).toBe(2);
  });
});
