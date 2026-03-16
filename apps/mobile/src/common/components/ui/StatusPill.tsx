import { Text, View } from "react-native";

type StatusTone = "neutral" | "success" | "warning" | "danger" | "brand";

type StatusPillProps = {
  label: string;
  tone?: StatusTone;
  className?: string;
};

const CONTAINER_CLASS: Record<StatusTone, string> = {
  neutral: "bg-surface",
  success: "bg-surface",
  warning: "bg-surface",
  danger: "bg-surface",
  brand: "bg-surface",
};

const TEXT_CLASS: Record<StatusTone, string> = {
  neutral: "text-surface-foreground",
  success: "text-success",
  warning: "text-warning-foreground",
  danger: "text-danger",
  brand: "text-brand",
};

export function StatusPill({ label, tone = "neutral", className = "" }: StatusPillProps) {
  return (
    <View className={`rounded-full px-3 py-1 ${CONTAINER_CLASS[tone]} ${className}`.trim()}>
      <Text className={`text-xs font-semibold uppercase tracking-wide ${TEXT_CLASS[tone]}`}>{label}</Text>
    </View>
  );
}
