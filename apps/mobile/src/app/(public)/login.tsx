import { useAuthStore } from "@/common/hooks/AuthContext";
import i18n from "@/common/i18n/i18n";
import { router } from "expo-router";
import { Button } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
export default function Login() {
  const signInAs = useAuthStore((s) => s.signInAs);

  return (
    <SafeAreaView style={{ padding: 24, gap: 12 }}>
      <Button
        title={i18n.t("login.loginAsPatient")}
        onPress={() => {
          signInAs("patient");
          router.replace("/");
        }}
      />
      <Button
        title={i18n.t("login.loginAsDriver")}
        onPress={() => {
          signInAs("driver");
          router.replace("/");
        }}
      />
      <Button
        title={i18n.t("login.loginAsEMT")}
        onPress={() => {
          signInAs("emt");
          router.replace("/");
        }}
      />
    </SafeAreaView>
  );
}
