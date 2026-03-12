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
