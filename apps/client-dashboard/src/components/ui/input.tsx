import * as React from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  // InputPrimitive handles aria/binding; we layer in the same focus treatment as buttons for keyboard clarity.
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        "w-full min-w-0 rounded-[var(--amb-radius)] border border-[color:var(--amb-border)] bg-[color:var(--amb-surface)] px-3 py-2 text-sm text-[color:var(--amb-foreground)] placeholder:text-[color:var(--amb-muted)] transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--amb-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--amb-background)]",
        className
      )}
      {...props}
    />
  );
}

export { Input };
