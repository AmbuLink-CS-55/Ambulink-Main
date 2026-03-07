import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import type { BookingLogEntry } from "@/services/booking.service";

type Status = "REQUESTED" | "ASSIGNED" | "ARRIVED" | "PICKEDUP" | "COMPLETED" | "CANCELLED";

function statusVariant(status: Status): BadgeVariant {
  if (status === "COMPLETED") return "completed";
  if (status === "CANCELLED") return "critical";
  if (status === "REQUESTED") return "default";
  if (status === "ASSIGNED") return "assigned";
  if (status === "ARRIVED") return "arrived";
  return "info";
}

export const bookingLogColumns = [
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
];
