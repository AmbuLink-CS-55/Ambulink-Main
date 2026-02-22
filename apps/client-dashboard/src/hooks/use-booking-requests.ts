import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import type { BookingRequestEntity } from "@/lib/booking-types";
import { queryKeys } from "@/lib/queryKeys";

export function useBookingRequestById(id: string) {
  const bookingRequestQuery = useQuery<BookingRequestEntity | null>({
    queryKey: queryKeys.bookingRequest(id),
    queryFn: async () => null,
    initialData: null,
    staleTime: Infinity,
    enabled: false,
  });

  return bookingRequestQuery.data;
}

export function useBookingRequests() {
  const bookingRequestIdsQuery = useQuery<string[]>({
    queryKey: queryKeys.bookingRequestIds(),
    queryFn: async () => [],
    initialData: [],
    staleTime: Infinity,
    enabled: false,
  });

  const bookingRequestIds = bookingRequestIdsQuery.data ?? [];

  const bookingRequestResults = useQueries({
    queries: bookingRequestIds.map((id) => ({
      queryKey: queryKeys.bookingRequest(id),
      queryFn: async () => null as BookingRequestEntity | null,
      initialData: null as BookingRequestEntity | null,
      staleTime: Infinity,
      enabled: false,
    })),
  });

  const bookingRequests = useMemo(
    () =>
      bookingRequestResults
        .map((result) => result.data)
        .filter((request): request is BookingRequestEntity => request !== null)
        .sort((a, b) => b.timestamp - a.timestamp),
    [bookingRequestResults]
  );

  return { bookingRequestIds, bookingRequests };
}
