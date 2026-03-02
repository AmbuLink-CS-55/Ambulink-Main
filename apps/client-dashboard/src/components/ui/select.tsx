"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type SelectOption = { label: string; value: string };

type SelectProps = React.ComponentProps<"select"> & {
  options: SelectOption[];
  placeholder?: string;
};

export function Select({ className, options, placeholder, ...props }: SelectProps) {
  return (
    <select
      // Native select retains full keyboard navigation; explicit focus ring keeps it visible for keyboard users.
      className={cn(
        "flex h-10 w-full rounded-[var(--radius)] border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--background)]",
        className
      )}
      {...props}
    >
      {placeholder ? (
        <option value="" disabled>
          {placeholder}
        </option>
      ) : null}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
