import { View, Button } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/src/auth/AuthContext";

export default function Login() {

  const signInAs = useAuthStore((s) => s.signInAs);

  return (
    <SafeAreaView style={{ padding: 24, gap: 12 }}>
      <Button
        title="Login as Patient"
        onPress={() => {
          signInAs("patient");
          router.replace("/");
        }}
      />
      <Button
        title="Login as Driver"
        onPress={() => {
          signInAs("driver");
          router.replace("/");
        }}
      />
      <Button
        title="Login as EMT"
        onPress={() => {
          signInAs("emt");
          router.replace("/");
        }}
      />
    </SafeAreaView>
  );
}
