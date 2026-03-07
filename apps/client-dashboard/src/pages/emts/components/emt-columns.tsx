import { Badge } from "@/components/ui/badge";
import type { BadgeVariant } from "@/components/ui/badge";
import type { User, UserStatus } from "@/lib/types";

function onlineBadge(status: UserStatus | null | undefined): {
  label: string;
  variant: BadgeVariant;
} {
  if (status === "AVAILABLE") return { label: "Online", variant: "available" };
  if (status === "BUSY") return { label: "Busy", variant: "busy" };
  return { label: "Offline", variant: "offline" };
}

export function createEmtColumns() {
  return [
    {
      header: "EMT",
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
      header: "Updated",
      width: "180px",
      cell: (row: User) => (row.updatedAt ? new Date(row.updatedAt).toLocaleString() : "-"),
    },
  ];
}
