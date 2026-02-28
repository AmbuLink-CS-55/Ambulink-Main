import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import type { User, UserStatus } from "@/lib/types";

function onlineBadge(status: UserStatus | null | undefined): { label: string; variant: BadgeVariant } {
  if (status === "AVAILABLE") return { label: "Online", variant: "success" };
  if (status === "BUSY") return { label: "Busy", variant: "warning" };
  return { label: "Offline", variant: "default" };
}

export function createDriverColumns({
  driverLocations,
  onEdit,
}: {
  driverLocations: Record<string, { x: number; y: number }>;
  onEdit: (driver: User) => void;
}) {
  return [
    {
      header: "Driver",
      width: "220px",
      cell: (row: User) => (
        <div>
          <div className="font-medium">{row.fullName ?? "Unnamed"}</div>
          <div className="text-xs text-muted-foreground">{row.id}</div>
        </div>
      ),
    },
    {
      header: "Contact",
      width: "220px",
      cell: (row: User) => (
        <div>
          <div>{row.phoneNumber ?? "-"}</div>
          <div className="text-xs text-muted-foreground">{row.email ?? "-"}</div>
        </div>
      ),
    },
    {
      header: "Status",
      width: "160px",
      cell: (row: User) => {
        const badge = onlineBadge(row.status ?? null);
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      header: "Location",
      width: "180px",
      cell: (row: User) => {
        const location = driverLocations[row.id];
        if (!location) return <span className="text-muted-foreground">-</span>;
        return (
          <div className="text-xs text-muted-foreground">
            {location.x.toFixed(4)}, {location.y.toFixed(4)}
          </div>
        );
      },
    },
    {
      header: "Updated",
      width: "180px",
      cell: (row: User) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"),
    },
    {
      header: "Actions",
      width: "120px",
      cell: (row: User) => (
        <Button size="sm" variant="outline" onClick={() => onEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];
}
