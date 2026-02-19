import { Fragment, useMemo } from "react";
import { DriverMarker } from "@/components/map/DriverMarker";
import { OngoingPatientMarker } from "@/components/map/OngoingPatientMarker";
import { useDriverStore } from "@/hooks/use-driver-store";
import type { DispatcherBookingPayload } from "@/lib/socket-types";

interface DriverMarkersProps {
  ongoingBookings: Record<string, DispatcherBookingPayload>;
}

export function DriverMarkers({ ongoingBookings }: DriverMarkersProps) {
  const driverLocations = useDriverStore((state) => state.driverLocations);
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
            {!isCompleted && booking.status === "ASSIGNED" && patientLocation && (
              <OngoingPatientMarker longitude={patientLocation.x} latitude={patientLocation.y} />
            )}
            {driverLocation && (
              <DriverMarker
                longitude={driverLocation.x}
                latitude={driverLocation.y}
                variant={isCompleted ? "available" : "active"}
              />
            )}
          </Fragment>
        );
      })}
    </>
  );
}
