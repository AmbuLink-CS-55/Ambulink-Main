export const queryKeys = {
  bookingLog: (providerId?: string | null, status?: string | null) =>
    ["booking-log", providerId ?? null, status ?? null] as const,
  bookingResponseAnalytics: (dispatcherId: string, from?: string, to?: string) =>
    ["booking-analytics-response", dispatcherId, from ?? null, to ?? null] as const,
  bookingZonesAnalytics: (dispatcherId: string, from?: string, to?: string) =>
    ["booking-analytics-zones", dispatcherId, from ?? null, to ?? null] as const,
  bookingInsightsAnalytics: (dispatcherId: string, from?: string, to?: string) =>
    ["booking-analytics-insights", dispatcherId, from ?? null, to ?? null] as const,
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
