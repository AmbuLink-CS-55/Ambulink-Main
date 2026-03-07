import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "critical"
  | "info"
  | "assigned"
  | "arrived"
  | "completed"
  | "available"
  | "busy"
  | "offline";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: BadgeVariant;
  label?: React.ReactNode;
};

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default:
    "bg-[color:var(--card)] text-[color:var(--foreground)] border border-[color:var(--border)]",
  success: "bg-[color:var(--primary)] text-[color:var(--card)]",
  warning: "bg-[color:var(--secondary)] text-[color:var(--card)]",
  critical: "bg-[color:var(--destructive)] text-[color:var(--card)]",
  info: "bg-[color:var(--accent)] text-[color:var(--card)]",
  assigned: "bg-[color:var(--status-assigned)] text-[color:var(--status-assigned-foreground)]",
  arrived: "bg-[color:var(--status-arrived)] text-[color:var(--status-arrived-foreground)]",
  completed: "bg-[color:var(--status-completed)] text-[color:var(--status-completed-foreground)]",
  available: "bg-[color:var(--status-available)] text-[color:var(--status-available-foreground)]",
  busy: "bg-[color:var(--status-busy)] text-[color:var(--status-busy-foreground)]",
  offline: "bg-[color:var(--status-offline)] text-[color:var(--status-offline-foreground)]",
};

export function Badge({ className, variant = "default", label, children, ...props }: BadgeProps) {
  // This component communicates status via both color and a text label, so we keep role=status for assistive tech.
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      <span>{label ?? children}</span>
    </span>
  );
}
