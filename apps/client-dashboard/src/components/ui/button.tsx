import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const focusRingClass =
  "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--amb-background)] focus-visible:ring-[color:var(--amb-brand-primary)]";

const buttonVariants = cva(
  cn(
    "group/button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border transition-all disabled:pointer-events-none disabled:opacity-60",
    focusRingClass
  ),
  {
    variants: {
      variant: {
        default:
          "bg-[color:var(--amb-brand-primary)] text-[color:var(--amb-surface)] hover:brightness-110 focus-visible:ring-offset-[color:var(--amb-background)]",
        primary:
          "bg-[color:var(--amb-brand-primary)] text-[color:var(--amb-surface)] hover:brightness-110 focus-visible:ring-offset-[color:var(--amb-background)]",
        secondary:
          "border border-[color:var(--amb-border)] bg-[color:var(--amb-surface-elevated)] text-[color:var(--amb-foreground)] hover:border-[color:var(--amb-brand-accent)]",
        destructive:
          "bg-[color:var(--amb-critical)] text-[color:var(--amb-surface)] hover:brightness-105",
        ghost:
          "bg-transparent text-[color:var(--amb-foreground)] hover:bg-[color:var(--amb-surface-elevated)]",
        outline:
          "border border-[color:var(--amb-border)] bg-transparent text-[color:var(--amb-foreground)] hover:border-[color:var(--amb-brand-accent)] focus-visible:ring-offset-[color:var(--amb-background)]",
        link: "bg-transparent px-0 text-[color:var(--amb-brand-primary)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 text-sm font-semibold",
        xs: "h-8 px-4 text-xs font-semibold",
        sm: "h-9 px-4 text-sm font-semibold",
        lg: "h-12 px-6 text-base font-semibold",
        icon: "h-10 w-10 rounded-full p-0",
        "icon-xs": "h-8 w-8 rounded-full p-0.5",
        "icon-sm": "h-9 w-9 rounded-full p-1.5",
        "icon-lg": "h-12 w-12 rounded-full p-2",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

function Button({
  className,
  variant = "primary",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  // The underlying primitive already sets role="button" and keyboard handling; we provide
  // custom focus-visible styling for WCAG while keeping the ring offset against the background.
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
