import { Redirect } from "expo-router";
import { useAuthStore } from "../common/hooks/AuthContext";

export default function Index() {
  const role = useAuthStore((s) => s.user?.role);

  if (!role) return <Redirect href="/(public)/login_modern" />;

  if (role === "patient") return <Redirect href="/(patient)/map" />;
  if (role === "driver") return <Redirect href="/(driver)" />;
  if (role === "emt") return <Redirect href="/(emt)/medical" />;

  return <Redirect href="/(patient)/map" />;
}
