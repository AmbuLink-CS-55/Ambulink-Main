import { Fragment } from "react";
import { MapRoute } from "@/components/ui/map";
import type { DispatcherBookingPayload } from "@/lib/socket-types";

export function BookingRoutesLayer({
  ongoingList,
  routes,
}: {
  ongoingList: DispatcherBookingPayload[];
  routes: Record<string, [number, number][]>;
}) {
  return ongoingList.map((booking) => {
    const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
    const routeKey = `${booking.bookingId}:${phase}`;
    const isCompleted = booking.status === "COMPLETED" || booking.status === "CANCELLED";

    return (
      <Fragment key={booking.bookingId}>
        {!isCompleted && phase === "patient" && routes[routeKey] ? (
          <MapRoute
            id={`route-${booking.bookingId}-patient`}
            coordinates={routes[routeKey]}
            color="#007AFF"
            width={4}
            opacity={0.85}
          />
        ) : null}
        {!isCompleted && phase === "hospital" && routes[routeKey] ? (
          <MapRoute
            id={`route-${booking.bookingId}-hospital`}
            coordinates={routes[routeKey]}
            color="#FF3B30"
            width={4}
            opacity={0.85}
          />
        ) : null}
      </Fragment>
    );
  });
}
