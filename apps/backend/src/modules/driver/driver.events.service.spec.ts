import { DriverEventsService } from "./events/driver.events.service";

describe("DriverEventsService eta notifications", () => {
  const setup = () => {
    const dbService = { db: {} };
    const driverRepository = {
      setDriverStatus: jest.fn(),
      checkDriverAvailability: jest.fn(),
      findDriverById: jest.fn(),
      setDriverLocation: jest.fn().mockResolvedValue([{}]),
      clearDriverLocation: jest.fn(),
      findDriversByLocation: jest.fn(),
      getDriverBooking: jest.fn(),
    };
    const bookingRepository = {
      getDriverActiveBooking: jest.fn(),
    };
    const bookingService = {
      getOngoingBookingDispatchInfoForDriver: jest.fn(),
      getEmtSubscribersForBooking: jest.fn().mockResolvedValue([]),
      buildAssignedBookingPayload: jest.fn(),
      updateBooking: jest.fn(),
      getActiveBookingForDriver: jest.fn(),
    };
    const eventBus = {
      publish: jest.fn(),
    };

    const service = new DriverEventsService(
      dbService as never,
      driverRepository as never,
      bookingRepository as never,
      bookingService as never,
      eventBus as never
    );

    return {
      service,
      driverRepository,
      bookingService,
      eventBus,
    };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("emits eta-updated on first eta and significant changes only", async () => {
    const { service, bookingService, eventBus } = setup();

    bookingService.getOngoingBookingDispatchInfoForDriver.mockResolvedValue({
      bookingId: "booking-1",
      patientId: "patient-1",
      dispatcherId: "dispatcher-1",
    });

    bookingService.buildAssignedBookingPayload.mockResolvedValue({
      bookingId: "booking-1",
      status: "ASSIGNED",
      driver: {
        id: "driver-1",
        location: { x: 80.0, y: 7.0 },
      },
      patient: {
        id: "patient-1",
        location: { x: 80.3, y: 7.3 },
      },
      pickupLocation: { x: 80.3, y: 7.3 },
      hospital: {
        id: "hospital-1",
        location: { x: 80.4, y: 7.4 },
      },
      provider: {
        id: "provider-1",
        name: "Provider",
      },
    });

    const nowSpy = jest.spyOn(Date, "now");
    nowSpy.mockReturnValue(100_000);

    await service.updateLocation("driver-1", { x: 80.0, y: 7.0 });

    const firstEtaEvents = eventBus.publish.mock.calls.filter(
      ([arg]) => arg.event === "booking:eta-updated"
    );
    expect(firstEtaEvents.length).toBeGreaterThan(0);

    eventBus.publish.mockClear();

    nowSpy.mockReturnValue(110_000);
    await service.updateLocation("driver-1", { x: 80.01, y: 7.01 });

    const secondEtaEvents = eventBus.publish.mock.calls.filter(
      ([arg]) => arg.event === "booking:eta-updated"
    );
    expect(secondEtaEvents).toHaveLength(0);

    eventBus.publish.mockClear();

    nowSpy.mockReturnValue(160_500);
    await service.updateLocation("driver-1", { x: 80.2, y: 7.2 });

    const thirdEtaEvents = eventBus.publish.mock.calls.filter(
      ([arg]) => arg.event === "booking:eta-updated"
    );
    expect(thirdEtaEvents.length).toBeGreaterThan(0);
  });
});
