import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import type { Ambulance } from "@/lib/types";

function statusVariant(status: string): BadgeVariant {
  if (status === "AVAILABLE") return "available";
  if (status === "BUSY") return "busy";
  return "offline";
}

export function createAmbulanceColumns() {
  return [
    {
      header: "Vehicle",
      width: "200px",
      cell: (row: Ambulance) => (
        <div>
          <div className="font-medium">{row.vehicleNumber}</div>
          <div className="text-xs text-muted-foreground">{row.id}</div>
        </div>
      ),
    },
    {
      header: "Equipment",
      width: "180px",
      cell: (row: Ambulance) => row.equipmentLevel ?? "-",
    },
    {
      header: "Status",
      width: "140px",
      cell: (row: Ambulance) => <Badge variant={statusVariant(row.status)}>{row.status}</Badge>,
    },
    {
      header: "Updated",
      width: "180px",
      cell: (row: Ambulance) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"),
    },
  ];
}
