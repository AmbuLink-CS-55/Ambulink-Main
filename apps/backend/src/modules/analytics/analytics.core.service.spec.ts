import { AnalyticsCoreService } from "./common/analytics.core.service";

describe("AnalyticsCoreService", () => {
  const setup = () => {
    const analyticsRepository = {
      getAnalyticsRows: jest.fn().mockResolvedValue([
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

    const service = new AnalyticsCoreService(
      dispatcherService as never,
      analyticsRepository as never
    );

    return { service, analyticsRepository };
  };

  it("computes response analytics with transition durations and per-driver breakdown", async () => {
    const { service } = setup();

    const result = await service.getResponseAnalytics("dispatcher-1");

    expect(result.totalBookings).toBe(2);
    expect(result.completedBookings).toBe(1);
    expect(result.cancelledBookings).toBe(1);
    expect(result.dispatchLatency.medianSeconds).toBe(150);
    expect(result.responseTime.count).toBe(1);
    expect(result.drivers.length).toBe(2);
    expect(result.drivers[0]?.driverName).toBe("Driver One");
  });

  it("passes range bounds into repository query", async () => {
    const { service, analyticsRepository } = setup();
    const from = "2026-03-01T00:00:00.000Z";
    const to = "2026-03-05T00:00:00.000Z";

    await service.getResponseAnalytics("dispatcher-1", from, to);

    expect(analyticsRepository.getAnalyticsRows).toHaveBeenCalledWith("provider-1", {
      from: new Date(from),
      to: new Date(to),
    });
  });

  it("aggregates zone grid counts", async () => {
    const { service } = setup();
    const zones = await service.getZonesAnalytics("dispatcher-1");
    expect(zones.responseOrigins.length).toBeGreaterThan(0);
    expect(zones.responseOrigins[0]?.count).toBe(2);
  });
});
