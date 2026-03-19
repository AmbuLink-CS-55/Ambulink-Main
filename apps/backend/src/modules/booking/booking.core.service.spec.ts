import { BadRequestException } from "@nestjs/common";
import { BookingCoreService } from "./common/booking.core.service";

describe("BookingCoreService reroute notifications", () => {
  const setup = (overrides?: {
    booking?: {
      id: string;
      providerId: string;
      dispatcherId: string | null;
      status: string;
      patientId: string | null;
      driverId: string | null;
    };
  }) => {
    const booking = overrides?.booking ?? {
      id: "booking-1",
      providerId: "provider-1",
      dispatcherId: "dispatcher-1",
      status: "ASSIGNED",
      patientId: "patient-1",
      driverId: "driver-previous",
    };

    const tx = {
      update: jest.fn(),
    };

    const db = {
      select: jest.fn(() => ({
        from: jest.fn(() => ({
          where: jest.fn().mockResolvedValue([booking]),
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

    return { service, eventBus, dispatcherService };
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

  it("rejects reassignment when booking is not active", async () => {
    const { service } = setup({
      booking: {
        id: "booking-1",
        providerId: "provider-1",
        dispatcherId: "dispatcher-1",
        status: "COMPLETED",
        patientId: "patient-1",
        driverId: "driver-previous",
      },
    });

    await expect(
      service.reassignBooking("booking-1", "dispatcher-1", {
        dispatcherId: "dispatcher-1",
        driverId: "driver-next",
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("does not emit booking:rerouted when no route-affecting fields changed", async () => {
    const { service, eventBus } = setup();

    await service.reassignBooking("booking-1", "dispatcher-1", {
      dispatcherId: "dispatcher-1",
    });

    const reroutedEvents = eventBus.publish.mock.calls.filter(
      ([evt]) => evt.event === "booking:rerouted"
    );
    expect(reroutedEvents).toHaveLength(0);
  });

  it("includes all changed route fields in reroute reason", async () => {
    const { service, eventBus, dispatcherService } = setup();

    await service.reassignBooking("booking-1", "dispatcher-1", {
      dispatcherId: "dispatcher-1",
      driverId: "driver-next",
      hospitalId: "hospital-2",
      pickupAddress: "New pickup address",
      pickupLocation: { x: 80.22, y: 7.22 },
    });

    const reroutedEvents = eventBus.publish.mock.calls
      .map(([evt]) => evt)
      .filter((evt) => evt.event === "booking:rerouted");

    expect(reroutedEvents.length).toBeGreaterThan(0);
    expect(reroutedEvents[0].payload.reason).toContain("Driver reassigned");
    expect(reroutedEvents[0].payload.reason).toContain("Hospital updated");
    expect(reroutedEvents[0].payload.reason).toContain("Pickup location updated");
    expect(reroutedEvents[0].payload.reason).toContain("Pickup address updated");
    expect(dispatcherService.findAllLiveDispatchersByProvider).toHaveBeenCalledWith("provider-1");
  });
});
