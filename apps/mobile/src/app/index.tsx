import { Redirect } from "expo-router";
import { useEffect } from "react";
import { useAuthStore } from "../common/hooks/AuthContext";

export default function Index() {
  const hydrated = useAuthStore((s) => s.hydrated);
  const hydrate = useAuthStore((s) => s.hydrate);
  const role = useAuthStore((s) => s.user?.role);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  if (!hydrated) return null;

  if (!role) return <Redirect href="/(patient)/map" />;

  if (role === "patient") return <Redirect href="/(patient)/map" />;
  if (role === "driver") return <Redirect href="/(driver)" />;
  if (role === "emt") return <Redirect href={"/(emt)" as never} />;

  return <Redirect href="/(patient)/map" />;
}
