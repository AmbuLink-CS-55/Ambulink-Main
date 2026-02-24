import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Ambulance } from "@/lib/types";

function statusVariant(status: string) {
  if (status === "AVAILABLE") return "success";
  if (status === "BUSY") return "secondary";
  return "outline";
}

export function createAmbulanceColumns({ onEdit }: { onEdit: (ambulance: Ambulance) => void }) {
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
    {
      header: "Actions",
      width: "120px",
      cell: (row: Ambulance) => (
        <Button size="sm" variant="outline" onClick={() => onEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];
}
