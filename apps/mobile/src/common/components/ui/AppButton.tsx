import type { ComponentProps } from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import React from "react";

type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";

type AppButtonProps = Omit<ComponentProps<typeof Pressable>, "children"> & {
  label: string;
  loading?: boolean;
  variant?: AppButtonVariant;
  className?: string;
  textClassName?: string;
  renderIcon?: () => React.ReactNode;
};

const BASE_CLASS =
  "min-h-12 rounded-xl px-4 py-3 items-center justify-center border flex-row gap-2";

const VARIANT_CLASS: Record<AppButtonVariant, string> = {
  primary: "bg-brand border-brand",
  secondary: "bg-surface border-border",
  ghost: "bg-transparent border-border",
  danger: "bg-danger border-danger",
  success: "bg-success border-success",
  warning: "bg-warning border-warning",
};

const DISABLED_CLASS: Record<AppButtonVariant, string> = {
  primary: "bg-muted border-border",
  secondary: "bg-muted border-border",
  ghost: "bg-transparent border-border",
  danger: "bg-muted border-border",
  success: "bg-muted border-border",
  warning: "bg-muted border-border",
};

const TEXT_CLASS: Record<AppButtonVariant, string> = {
  primary: "text-brand-foreground",
  secondary: "text-surface-foreground",
  ghost: "text-foreground",
  danger: "text-danger-foreground",
  success: "text-success-foreground",
  warning: "text-warning-foreground",
};

const DISABLED_TEXT_CLASS = "text-muted-foreground";
const SPINNER_COLOR: Record<AppButtonVariant, string> = {
  primary: "#ffffff",
  secondary: "#111827",
  ghost: "#111827",
  danger: "#ffffff",
  success: "#ffffff",
  warning: "#111827",
};

export function AppButton({
  label,
  loading = false,
  disabled,
  variant = "primary",
  className = "",
  textClassName = "",
  renderIcon,
  ...pressableProps
}: AppButtonProps) {
  const isDisabled = Boolean(disabled || loading);
  const containerClass = `${BASE_CLASS} ${isDisabled ? DISABLED_CLASS[variant] : VARIANT_CLASS[variant]} ${className}`.trim();
  const resolvedTextClass = `${isDisabled ? DISABLED_TEXT_CLASS : TEXT_CLASS[variant]} font-semibold text-base ${textClassName}`.trim();

  return (
    <Pressable 
      accessibilityRole="button" 
      disabled={isDisabled} 
      className={containerClass} 
      {...pressableProps}
    >
      {loading ? (
        <ActivityIndicator size="small" color={isDisabled ? "#6b7280" : SPINNER_COLOR[variant]} />
      ) : (
        renderIcon?.()
      )}
      <Text className={resolvedTextClass}>{label}</Text>
    </Pressable>
  );
}
