import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "critical" | "info";

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
};

const dotVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-[color:var(--border)]",
  success: "bg-[color:var(--primary)]",
  warning: "bg-[color:var(--secondary)]",
  critical: "bg-[color:var(--destructive)]",
  info: "bg-[color:var(--accent)]",
};

export function Badge({ className, variant = "default", label, children, ...props }: BadgeProps) {
  // This component communicates status via both color and a text label, so we keep role=status for assistive tech.
  return (
    <span
      role="status"
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", dotVariants[variant])} />
      <span>{label ?? children}</span>
    </span>
  );
}
