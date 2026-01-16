import { View, Button } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/auth/AuthContext";
import i18n from "@/languages/i18n";

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
