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
    const patientLocation = booking.pickupLocation ?? booking.patient.location;
    const driverLocation = booking.driver.location;
    const hospitalLocation = booking.hospital.location;
    const phase = booking.status === "ASSIGNED" ? "patient" : "hospital";
    const routeKey = `${booking.bookingId}:${phase}`;
    const isCompleted = booking.status === "COMPLETED" || booking.status === "CANCELLED";

    return (
      <Fragment key={booking.bookingId}>
        {!isCompleted &&
        phase === "patient" &&
        driverLocation &&
        patientLocation &&
        routes[routeKey] ? (
          <MapRoute
            id={`route-${booking.bookingId}-patient`}
            coordinates={routes[routeKey]}
            color="var(--amb-warning)"
            width={4}
            opacity={0.85}
          />
        ) : null}
        {!isCompleted &&
        phase === "hospital" &&
        driverLocation &&
        hospitalLocation &&
        routes[routeKey] ? (
          <MapRoute
            id={`route-${booking.bookingId}-hospital`}
            coordinates={routes[routeKey]}
            color="var(--amb-critical)"
            width={4}
            opacity={0.85}
          />
        ) : null}
      </Fragment>
    );
  });
}
