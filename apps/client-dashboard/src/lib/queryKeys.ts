export const queryKeys = {
  bookingLog: (providerId?: string | null) => ["booking-log", providerId ?? null] as const,
  bookingRequestIds: () => ["booking-request-ids"] as const,
  bookingRequest: (id: string) => ["booking-request", id] as const,
  bookingDecisions: () => ["booking-decisions"] as const,
  ongoingBookings: () => ["ongoing-bookings"] as const,
  driverLocations: () => ["driver-locations"] as const,
  drivers: (params?: Record<string, unknown>) => ["drivers", params ?? null] as const,
  ambulances: (params?: Record<string, unknown>) => ["ambulances", params ?? null] as const,
  hospitals: () => ["hospitals"] as const,
};
