import {
  formatCoordinate,
  formatDurationBetween,
  formatUtcTimestamp,
} from "./analytics.booking-report.utils";

describe("analytics.booking-report.utils", () => {
  it("formats timestamps consistently in UTC", () => {
    const value = formatUtcTimestamp(new Date("2026-03-13T08:09:10.000Z"));
    expect(value).toBe("2026-03-13 08:09:10 UTC");
  });

  it("formats coordinates to fixed precision", () => {
    expect(formatCoordinate(79.852341221)).toBe("79.852341");
    expect(formatCoordinate(null)).toBe("N/A");
  });

  it("formats duration between timestamps", () => {
    const start = new Date("2026-03-13T08:00:00.000Z");
    const end = new Date("2026-03-13T09:10:25.000Z");
    expect(formatDurationBetween(start, end)).toBe("1h 10m");
    expect(formatDurationBetween(end, start)).toBe("N/A");
  });
});
