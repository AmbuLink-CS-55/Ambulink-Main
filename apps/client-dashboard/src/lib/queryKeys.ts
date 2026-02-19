export const queryKeys = {
  bookingLog: (providerId?: string | null) => ["booking-log", providerId ?? null] as const,
  bookingRequests: () => ["booking-requests"] as const,
  bookingDecisions: () => ["booking-decisions"] as const,
  ongoingBookings: () => ["ongoing-bookings"] as const,
  driverLocations: () => ["driver-locations"] as const,
  drivers: (params?: Record<string, unknown>) => ["drivers", params ?? null] as const,
  ambulances: (params?: Record<string, unknown>) => ["ambulances", params ?? null] as const,
  hospitals: () => ["hospitals"] as const,
};
