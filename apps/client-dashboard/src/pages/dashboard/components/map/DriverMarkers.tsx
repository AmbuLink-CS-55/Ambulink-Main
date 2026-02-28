import { Fragment, useMemo } from "react";
import { DriverMarker } from "@/pages/dashboard/components/map/DriverMarker";
import { OngoingPatientMarker } from "@/pages/dashboard/components/map/OngoingPatientMarker";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type { DispatcherBookingPayload } from "@/lib/socket-types";

interface DriverMarkersProps {
  ongoingBookings: Record<string, DispatcherBookingPayload>;
}

export function DriverMarkers({ ongoingBookings }: DriverMarkersProps) {
  const driverLocationsQuery = useQuery<Record<string, { x: number; y: number }>>({
    queryKey: queryKeys.driverLocations(),
    queryFn: async () => ({}),
    initialData: {},
    staleTime: Infinity,
    enabled: false,
  });
  const driverLocations = useMemo(
    () => driverLocationsQuery.data ?? {},
    [driverLocationsQuery.data]
  );
  const ongoingList = useMemo(() => Object.values(ongoingBookings), [ongoingBookings]);

  const activeDriverIds = useMemo(
    () => new Set(ongoingList.map((b) => b.driver.id).filter(Boolean)),
    [ongoingList]
  );

  const availableDrivers = useMemo(() => {
    return Object.entries(driverLocations).filter(([id]) => !activeDriverIds.has(id));
  }, [driverLocations, activeDriverIds]);

  return (
    <>
      {/* Available drivers */}
      {availableDrivers.map(([id, location]) => (
        <DriverMarker
          key={`available-${id}`}
          longitude={location.x}
          latitude={location.y}
          variant="available"
        />
      ))}

      {/* Ongoing booking drivers */}
      {ongoingList.map((booking) => {
        const patientLocation = booking.pickupLocation ?? booking.patient.location;
        const driverLocation = booking.driver.location;
        const isCompleted = booking.status === "COMPLETED" || booking.status === "CANCELLED";

        return (
          <Fragment key={booking.bookingId}>
            {!isCompleted && booking.status === "ASSIGNED" && patientLocation ? (
              <OngoingPatientMarker longitude={patientLocation.x} latitude={patientLocation.y} />
            ) : null}
            {driverLocation ? (
              <DriverMarker
                longitude={driverLocation.x}
                latitude={driverLocation.y}
                variant={isCompleted ? "available" : "active"}
              />
            ) : null}
          </Fragment>
        );
      })}
    </>
  );
}
