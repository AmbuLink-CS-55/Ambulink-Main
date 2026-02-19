import { useEffect } from "react";
import { useSocket } from "@/hooks/SocketContext";
import { addBookingHistory } from "@/utils/bookingHistory";
import type { BookingAssignedPayload } from "@ambulink/types";

export function useDriverHistory() {
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;
    let lastAssigned: BookingAssignedPayload | null = null;

    const onAssigned = (payload: BookingAssignedPayload) => {
      lastAssigned = payload;
    };

    const onCompleted = () => {
      if (!lastAssigned) return;
      addBookingHistory("DRIVER", {
        id: `${Date.now()}:${lastAssigned.driver?.id ?? "driver"}`,
        bookingId: lastAssigned.bookingId ?? null,
        role: "DRIVER",
        status: "COMPLETED",
        patientName: lastAssigned.patient?.fullName ?? null,
        driverName: lastAssigned.driver?.fullName ?? null,
        hospitalName: lastAssigned.hospital?.name ?? null,
        providerName: lastAssigned.provider?.name ?? null,
        providerHotline: lastAssigned.provider?.hotlineNumber ?? null,
        createdAt: new Date().toISOString(),
      });
      lastAssigned = null;
    };

    const onCancelled = () => {
      if (!lastAssigned) return;
      addBookingHistory("DRIVER", {
        id: `${Date.now()}:${lastAssigned.driver?.id ?? "driver"}`,
        bookingId: lastAssigned.bookingId ?? null,
        role: "DRIVER",
        status: "CANCELLED",
        patientName: lastAssigned.patient?.fullName ?? null,
        driverName: lastAssigned.driver?.fullName ?? null,
        hospitalName: lastAssigned.hospital?.name ?? null,
        providerName: lastAssigned.provider?.name ?? null,
        providerHotline: lastAssigned.provider?.hotlineNumber ?? null,
        createdAt: new Date().toISOString(),
      });
      lastAssigned = null;
    };

    socket.on("booking:assigned", onAssigned);
    socket.on("booking:completed", onCompleted);
    socket.on("booking:cancelled", onCancelled);

    return () => {
      socket.off("booking:assigned", onAssigned);
      socket.off("booking:completed", onCompleted);
      socket.off("booking:cancelled", onCancelled);
    };
  }, [socket]);
}
