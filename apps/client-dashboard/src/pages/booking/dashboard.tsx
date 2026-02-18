import { useMemo, useEffect } from "react";
import { type BookingLogEntry, useGetBookingLog } from "@/services/booking.service";
import { VirtualizedTable } from "@/components/VirtualizedTable";
import { Badge } from "@/components/ui/badge";
import { useSocketStore } from "@/hooks/use-socket-store";
import { useQueryClient } from "@tanstack/react-query";
import env from "@/../env";

type Status = "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";

function statusVariant(status: Status) {
  if (status === "COMPLETED") return "success";
  if (status === "CANCELLED") return "destructive";
  if (status === "REQUESTED") return "outline";
  return "secondary";
}

export default function BookingLogPage() {
  const queryClient = useQueryClient();
  const bookingLog = useGetBookingLog({ providerId: env.VITE_PROVIDER_ID });
  const socketConnected = useSocketStore((state) => state.isConnected);
  const bookingLogUpdates = useSocketStore((state) => state.bookingLogUpdates);

  useEffect(() => {
    const values = Object.values(bookingLogUpdates);
    if (values.length === 0) return;
    if (!env.VITE_PROVIDER_ID) return;
    const matchesProvider = values.some((update) =>
      update.providerId ? update.providerId === env.VITE_PROVIDER_ID : false
    );
    if (!matchesProvider) return;
    queryClient.invalidateQueries({ queryKey: ["booking-log"] });
  }, [bookingLogUpdates, queryClient]);

  const rows = useMemo(() => bookingLog.data ?? [], [bookingLog.data]);

  const columns = useMemo(
    () => [
      {
        header: "Booking",
        width: "180px",
        cell: (row: BookingLogEntry) => (
          <div className="space-y-1">
            <div className="font-medium">{row.bookingId}</div>
            <div className="text-xs text-muted-foreground">Provider: {row.providerName ?? "-"}</div>
          </div>
        ),
      },
      {
        header: "Patient",
        width: "200px",
        cell: (row: BookingLogEntry) => (
          <div className="space-y-1">
            <div className="font-medium">{row.patientName ?? "Unknown"}</div>
            <div className="text-xs text-muted-foreground">{row.patientPhone ?? "-"}</div>
          </div>
        ),
      },
      {
        header: "Driver",
        width: "200px",
        cell: (row: BookingLogEntry) => (
          <div className="space-y-1">
            <div className="font-medium">{row.driverName ?? row.driverId ?? "-"}</div>
            <div className="text-xs text-muted-foreground">{row.driverPhone ?? "-"}</div>
          </div>
        ),
      },
      {
        header: "Ambulance",
        width: "160px",
        cell: (row: BookingLogEntry) => row.ambulanceId ?? "-",
      },
      {
        header: "Hospital",
        width: "180px",
        cell: (row: BookingLogEntry) => row.hospitalName ?? "-",
      },
      {
        header: "Status",
        width: "140px",
        cell: (row: BookingLogEntry) => (
          <Badge variant={statusVariant(row.status as Status)}>{row.status}</Badge>
        ),
      },
      {
        header: "Requested",
        width: "170px",
        cell: (row: BookingLogEntry) =>
          row.requestedAt ? new Date(row.requestedAt).toLocaleString() : "-",
      },
      {
        header: "Completed",
        width: "170px",
        cell: (row: BookingLogEntry) =>
          row.completedAt ? new Date(row.completedAt).toLocaleString() : "-",
      },
    ],
    []
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Booking Log</h1>
          <p className="text-sm text-muted-foreground">
            All booking history across statuses. Live updates: {socketConnected ? "on" : "off"}.
          </p>
        </div>
      </div>

      <VirtualizedTable
        columns={columns}
        rows={rows}
        keyFn={(row) => row.bookingId}
        height={640}
        rowHeight={56}
      />
    </div>
  );
}
