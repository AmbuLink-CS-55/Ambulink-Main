import { BadRequestException } from "@nestjs/common";
import { BookingService } from "./booking.service";

describe("BookingService", () => {
  const buildService = () => {
    const bookingRepository = {
      updateBooking: jest.fn(),
      getEmtsSubscribedToBooking: jest.fn(),
      clearSubscribedBookingForBooking: jest.fn(),
      getDriverActiveBooking: jest.fn(),
      clearUserSubscribedBooking: jest.fn(),
      setUserSubscribedBooking: jest.fn(),
      getBookingDetailsRow: jest.fn(),
      appendBookingNote: jest.fn(),
    };
    const notificationService = {
      notifyDispatcher: jest.fn(),
      notifyAllDispatchers: jest.fn(),
      notifyPatient: jest.fn(),
      notifyDriver: jest.fn(),
      notifyEmt: jest.fn(),
    };
    const dbService = {
      db: {
        transaction: async (fn: (tx: unknown) => Promise<unknown>) => fn({}),
        select: jest.fn(),
      },
    };

    const service = new BookingService(
      dbService as never,
      {
        findLiveDispatchersByProvider: jest.fn(),
        findAllLiveDispatchersByProvider: jest.fn(),
      } as never,
      notificationService as never,
      { requestApproval: jest.fn(), notifyDecision: jest.fn() } as never,
      bookingRepository as never,
      { setDriverStatus: jest.fn(), findDriverById: jest.fn() } as never,
      { findPatientById: jest.fn(), createPatient: jest.fn() } as never,
      { getHospitalById: jest.fn() } as never
    );

    return { service, bookingRepository, notificationService };
  };

  it("marks booking completed and clears subscriptions", async () => {
    const { service, bookingRepository } = buildService();

    bookingRepository.updateBooking.mockResolvedValue([
      {
        id: "booking-1",
        status: "COMPLETED",
        dispatcherId: "dispatcher-1",
        providerId: "provider-1",
        patientId: "patient-1",
        driverId: "driver-1",
        cancellationReason: null,
      },
    ]);
    bookingRepository.getEmtsSubscribedToBooking.mockResolvedValue([{ emtId: "emt-1" }]);

    await service.updateBooking("booking-1", { status: "COMPLETED" } as never);

    expect(bookingRepository.updateBooking).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        status: "COMPLETED",
        ongoing: false,
        completedAt: expect.any(Date),
      }),
      expect.anything()
    );
    expect(bookingRepository.clearSubscribedBookingForBooking).toHaveBeenCalledWith(
      "booking-1",
      expect.anything()
    );
  });

  it("marks booking cancelled and clears subscriptions", async () => {
    const { service, bookingRepository } = buildService();

    bookingRepository.updateBooking.mockResolvedValue([
      {
        id: "booking-2",
        status: "CANCELLED",
        dispatcherId: "dispatcher-1",
        providerId: "provider-1",
        patientId: "patient-1",
        driverId: "driver-1",
        cancellationReason: "cancelled",
      },
    ]);
    bookingRepository.getEmtsSubscribedToBooking.mockResolvedValue([{ emtId: "emt-1" }]);

    await service.updateBooking("booking-2", { status: "CANCELLED" } as never);

    expect(bookingRepository.updateBooking).toHaveBeenCalledWith(
      "booking-2",
      expect.objectContaining({ status: "CANCELLED", ongoing: false }),
      expect.anything()
    );
    expect(bookingRepository.clearSubscribedBookingForBooking).toHaveBeenCalledWith(
      "booking-2",
      expect.anything()
    );
  });

  it("reassign releases previous driver when no active bookings", async () => {
    const { service, bookingRepository, notificationService } = buildService();

    const booking = {
      id: "booking-3",
      providerId: "provider-1",
      dispatcherId: "dispatcher-1",
      driverId: "driver-old",
      status: "ASSIGNED",
      patientId: "patient-1",
    };

    (service as never).dbService.db.select = jest.fn(() => ({
      from: () => ({
        where: async () => [booking],
      }),
    }));

    (service as never).getDispatcherOrThrow = jest.fn().mockResolvedValue({
      id: "dispatcher-1",
      providerId: "provider-1",
    });
    (service as never).getDriverForDispatcherOrThrow = jest
      .fn()
      .mockResolvedValue({ id: "driver-new", providerId: "provider-1", isActive: true });
    (service as never).buildAssignedBookingPayload = jest
      .fn()
      .mockResolvedValue({ bookingId: "booking-3" });
    (service as never).buildDispatcherBookingPayload = jest
      .fn()
      .mockResolvedValue({ bookingId: "booking-3" });

    bookingRepository.getDriverActiveBooking.mockResolvedValueOnce([]).mockResolvedValueOnce([]);
    bookingRepository.updateBooking.mockResolvedValue([booking]);
    bookingRepository.getEmtsSubscribedToBooking.mockResolvedValue([]);

    const driverRepository = (service as never).driverRepository;
    driverRepository.setDriverStatus = jest.fn();

    await service.reassignBooking("booking-3", "dispatcher-1", {
      dispatcherId: "dispatcher-1",
      driverId: "driver-new",
    });

    expect(bookingRepository.clearUserSubscribedBooking).toHaveBeenCalledWith(
      "driver-old",
      expect.anything()
    );
    expect(driverRepository.setDriverStatus).toHaveBeenCalledWith(
      "driver-old",
      "AVAILABLE",
      expect.anything()
    );
    expect(notificationService.notifyDriver).toHaveBeenCalledWith(
      "driver-old",
      "booking:cancelled",
      expect.objectContaining({ bookingId: "booking-3" })
    );
  });

  it("rejects dispatcher note when booking is not active", async () => {
    const { service, bookingRepository } = buildService();

    (service as never).getDispatcherOrThrow = jest.fn().mockResolvedValue({
      id: "dispatcher-1",
      providerId: "provider-1",
      fullName: "Dispatcher A",
    });
    bookingRepository.getBookingDetailsRow.mockResolvedValue([
      {
        bookingId: "booking-1",
        providerId: "provider-1",
        status: "COMPLETED",
      },
    ]);

    await expect(
      service.addDispatcherNote("booking-1", "dispatcher-1", "Post-completion note")
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(bookingRepository.appendBookingNote).not.toHaveBeenCalled();
  });
});
