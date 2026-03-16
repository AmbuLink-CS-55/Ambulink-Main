export const queryKeys = {
  bookingLog: (providerId?: string | null) => ["booking-log", providerId ?? null] as const,
  analyticsResponse: (dispatcherId: string, from?: string, to?: string) =>
    ["analytics-response", dispatcherId, from ?? null, to ?? null] as const,
  analyticsZones: (dispatcherId: string, from?: string, to?: string) =>
    ["analytics-zones", dispatcherId, from ?? null, to ?? null] as const,
  analyticsInsights: (dispatcherId: string, from?: string, to?: string) =>
    ["analytics-insights", dispatcherId, from ?? null, to ?? null] as const,
  bookingDetails: (bookingId: string) => ["booking-details", bookingId] as const,
  bookingRequestIds: () => ["booking-request-ids"] as const,
  bookingRequest: (id: string) => ["booking-request", id] as const,
  bookingDecisions: () => ["booking-decisions"] as const,
  ongoingBookings: () => ["ongoing-bookings"] as const,
  driverLocations: () => ["driver-locations"] as const,
  drivers: (params?: Record<string, unknown>) => ["drivers", params ?? null] as const,
  emts: (params?: Record<string, unknown>) => ["emts", params ?? null] as const,
  ambulances: (params?: Record<string, unknown>) => ["ambulances", params ?? null] as const,
  hospitals: () => ["hospitals"] as const,
};
