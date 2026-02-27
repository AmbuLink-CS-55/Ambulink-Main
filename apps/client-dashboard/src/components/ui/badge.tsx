import * as React from "react";

import { cn } from "@/lib/utils";

export type BadgeVariant = "default" | "success" | "warning" | "critical" | "info";

type BadgeProps = React.ComponentProps<"span"> & {
  variant?: BadgeVariant;
  label?: React.ReactNode;
};

const badgeVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-[color:var(--amb-surface-elevated)] text-[color:var(--amb-foreground)] border border-[color:var(--amb-border)]",
  success: "bg-[color:var(--amb-success)] text-[color:var(--amb-surface)]",
  warning: "bg-[color:var(--amb-warning)] text-[color:var(--amb-surface)]",
  critical: "bg-[color:var(--amb-critical)] text-[color:var(--amb-surface)]",
  info: "bg-[color:var(--amb-info)] text-[color:var(--amb-surface)]",
};

const dotVariants: Record<NonNullable<BadgeProps["variant"]>, string> = {
  default: "bg-[color:var(--amb-border)]",
  success: "bg-[color:var(--amb-success)]",
  warning: "bg-[color:var(--amb-warning)]",
  critical: "bg-[color:var(--amb-critical)]",
  info: "bg-[color:var(--amb-info)]",
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
