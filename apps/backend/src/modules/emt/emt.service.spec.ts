import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { EmtEventsService } from "./events/emt.events.service";

describe("EmtService", () => {
  const buildService = () => {
    const emtRepository = {
      findEmtById: jest.fn(),
      setEmtStatus: jest.fn(),
    };
    const bookingService = {
      getActiveBookingById: jest.fn(),
      setUserSubscribedBooking: jest.fn(),
      buildAssignedBookingPayload: jest.fn(),
      buildEmtMediaNote: jest.fn(),
      appendBookingNote: jest.fn(),
      getEmtSubscribersForBooking: jest.fn(),
    };
    const dispatcherService = {
      findAllLiveDispatchersByProvider: jest.fn(),
    };
    const eventBus = {
      publish: jest.fn(),
    };

    const service = new EmtEventsService(
      emtRepository as never,
      bookingService as never,
      dispatcherService as never,
      eventBus as never
    );

    return { service, emtRepository, bookingService, dispatcherService, eventBus };
  };

  it("rejects subscription outside provider scope", async () => {
    const { service, emtRepository, bookingService } = buildService();

    emtRepository.findEmtById.mockResolvedValue([
      {
        id: "emt-1",
        providerId: "provider-A",
        role: "EMT",
        isActive: true,
      },
    ]);

    bookingService.getActiveBookingById.mockResolvedValue({
      id: "booking-1",
      providerId: "provider-B",
      status: "ASSIGNED",
    });

    await expect(service.subscribeToBooking("emt-1", "booking-1")).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it("rejects notes when emt is not subscribed to booking", async () => {
    const { service, emtRepository } = buildService();

    emtRepository.findEmtById.mockResolvedValue([
      {
        id: "emt-1",
        providerId: "provider-A",
        role: "EMT",
        isActive: true,
        subscribedBookingId: "other-booking",
      },
    ]);

    await expect(service.addNote("emt-1", "booking-1", "note")).rejects.toBeInstanceOf(
      ForbiddenException
    );
  });

  it("publishes note events to dispatchers and emt subscribers", async () => {
    const { service, emtRepository, bookingService, dispatcherService, eventBus } = buildService();

    emtRepository.findEmtById.mockResolvedValue([
      {
        id: "emt-1",
        providerId: "provider-A",
        role: "EMT",
        isActive: true,
        subscribedBookingId: "booking-1",
      },
    ]);

    bookingService.getActiveBookingById.mockResolvedValue({
      id: "booking-1",
      providerId: "provider-A",
      status: "ASSIGNED",
    });
    bookingService.getEmtSubscribersForBooking.mockResolvedValue([
      { emtId: "emt-1" },
      { emtId: "emt-2" },
    ]);
    dispatcherService.findAllLiveDispatchersByProvider.mockResolvedValue([
      "dispatcher-1",
      "dispatcher-2",
    ]);

    await service.addNote("emt-1", "booking-1", "Patient stabilized");

    expect(bookingService.appendBookingNote).toHaveBeenCalledWith(
      "booking-1",
      expect.objectContaining({
        bookingId: "booking-1",
        authorId: "emt-1",
        authorRole: "EMT",
      })
    );
    expect(eventBus.publish).toHaveBeenCalledTimes(4);
  });

  it("rejects empty note when no files are attached", async () => {
    const { service, emtRepository, bookingService } = buildService();

    emtRepository.findEmtById.mockResolvedValue([
      {
        id: "emt-1",
        providerId: "provider-A",
        role: "EMT",
        isActive: true,
        subscribedBookingId: "booking-1",
      },
    ]);

    bookingService.getActiveBookingById.mockResolvedValue({
      id: "booking-1",
      providerId: "provider-A",
      status: "ASSIGNED",
    });

    await expect(service.addNote("emt-1", "booking-1", "   ")).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("uses media-note builder when files are present", async () => {
    const { service, emtRepository, bookingService, dispatcherService } = buildService();
    const mediaNote = {
      id: "note-media-1",
      bookingId: "booking-1",
      authorId: "emt-1",
      authorName: "EMT One",
      authorRole: "EMT",
      content: "voice note",
      type: "MEDIA",
      attachments: [
        {
          id: "att-1",
          kind: "AUDIO",
          filename: "voice.m4a",
          mimeType: "audio/m4a",
          sizeBytes: 42,
          url: "https://example.com/voice.m4a",
        },
      ],
      createdAt: new Date().toISOString(),
    };

    emtRepository.findEmtById.mockResolvedValue([
      {
        id: "emt-1",
        providerId: "provider-A",
        fullName: "EMT One",
        role: "EMT",
        isActive: true,
        subscribedBookingId: "booking-1",
      },
    ]);
    bookingService.getActiveBookingById.mockResolvedValue({
      id: "booking-1",
      providerId: "provider-A",
      patientId: "patient-1",
      status: "ASSIGNED",
    });
    bookingService.getEmtSubscribersForBooking.mockResolvedValue([{ emtId: "emt-1" }]);
    dispatcherService.findAllLiveDispatchersByProvider.mockResolvedValue([]);
    bookingService.buildEmtMediaNote.mockResolvedValue(mediaNote);

    await service.addNote("emt-1", "booking-1", "voice note", [
      {
        buffer: Buffer.from("voice"),
        originalname: "voice.m4a",
        mimetype: "audio/m4a",
        size: 42,
      },
    ]);

    expect(bookingService.buildEmtMediaNote).toHaveBeenCalled();
    expect(bookingService.appendBookingNote).toHaveBeenCalledWith("booking-1", mediaNote);
  });
});
