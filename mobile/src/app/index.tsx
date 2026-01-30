import { Redirect } from "expo-router";
import { useAuthStore } from "../hooks/AuthContext";

export default function Index() {
  const role = useAuthStore((s) => s.user?.role);

  if (!role) return <Redirect href="/(public)/login" />;

  if (role === "patient") return <Redirect href="/(patient)/map" />;
  if (role === "driver") return <Redirect href="/(driver)" />;
  if (role === "emt") return <Redirect href="/(emt)/medical" />;

  return <Redirect href="/(patient)/map" />;
}
