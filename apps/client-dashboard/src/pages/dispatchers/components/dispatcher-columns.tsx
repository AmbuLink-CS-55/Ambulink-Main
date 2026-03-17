import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import type { User } from "@/lib/types";

function activeBadge(isActive: boolean): { label: string; variant: BadgeVariant } {
  if (isActive) return { label: "Active", variant: "available" };
  return { label: "Inactive", variant: "offline" };
}

export function createDispatcherColumns() {
  return [
    {
      header: "Dispatcher",
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
      width: "260px",
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
        const badge = activeBadge(Boolean(row.isActive));
        return <Badge variant={badge.variant}>{badge.label}</Badge>;
      },
    },
    {
      header: "Updated",
      width: "180px",
      cell: (row: User) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"),
    },
  ];
}
