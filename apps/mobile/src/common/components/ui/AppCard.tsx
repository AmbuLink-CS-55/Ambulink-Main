import type { ComponentProps, PropsWithChildren } from "react";
import { View } from "react-native";

type AppCardVariant = "default" | "elevated" | "sheet";

type AppCardProps = PropsWithChildren<
  ComponentProps<typeof View> & {
  className?: string;
  variant?: AppCardVariant;
}
>;

const VARIANT_CLASSES: Record<AppCardVariant, string> = {
  default: "rounded-2xl border border-border bg-card p-4",
  elevated: "rounded-2xl border border-border bg-card p-4 shadow-sm",
  sheet: "rounded-3xl border border-border bg-card px-4 py-4 shadow-sm",
};

export function AppCard({ children, className = "", variant = "default", ...viewProps }: AppCardProps) {
  return (
    <View className={`${VARIANT_CLASSES[variant]} ${className}`.trim()} {...viewProps}>
      {children}
    </View>
  );
}
