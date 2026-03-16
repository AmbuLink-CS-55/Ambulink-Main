import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { useAuthStore } from "@/common/hooks/AuthContext";
import {
  loginStaff,
  toMobileAuthErrorMessage,
  type MobileStaffRole,
} from "@/common/lib/staffAuth";
import { AppButton } from "@/common/components/ui/AppButton";

const ROLE_OPTIONS = [
  { role: "DRIVER" as MobileStaffRole, label: "Driver" },
  { role: "EMT" as MobileStaffRole, label: "EMT" },
];

export default function LoginModern() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signInStaff = useAuthStore((state) => state.signInStaff);

  const [role, setRole] = useState<MobileStaffRole>("DRIVER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const issues = useMemo(() => {
    const next: string[] = [];
    if (!email.trim()) next.push("Email is required.");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      next.push("Email format is invalid.");
    }
    if (!password) next.push("Password is required.");
    return next;
  }, [email, password]);

  if (user?.role === "driver") return <Redirect href="/(driver)" />;
  if (user?.role === "emt") return <Redirect href={"/(emt)" as never} />;

  const onLogin = async () => {
    if (issues.length > 0) {
      setError(issues[0] ?? "Please complete the form.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const session = await loginStaff({
        role,
        email: email.trim().toLowerCase(),
        password,
      });

      await signInStaff(session);

      if (session.user.role === "DRIVER") {
        router.replace("/(driver)");
      } else {
        router.replace("/(emt)" as never);
      }
    } catch (loginError) {
      console.error("[mobile-auth] login failed", loginError);
      setError(
        toMobileAuthErrorMessage(
          loginError,
          "Login failed. Check credentials and try again."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: 20,
            justifyContent: "center",
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700" }}>Staff Login</Text>
          <Text style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            Login for driver and EMT mobile access.
          </Text>

          <View style={{ marginTop: 20, flexDirection: "row", gap: 8 }}>
            {ROLE_OPTIONS.map((option) => {
              const active = option.role === role;
              return (
                <Pressable
                  key={option.role}
                  onPress={() => setRole(option.role)}
                  style={{
                    flex: 1,
                    minHeight: 48,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: active ? "#2563eb" : "#d1d5db",
                    backgroundColor: active ? "#2563eb" : "#fff",
                  }}
                >
                  <Text
                    style={{
                      fontWeight: "700",
                      color: active ? "#fff" : "#111827",
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 20, gap: 10 }}>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#6b7280"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={{
                minHeight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#d1d5db",
                paddingHorizontal: 16,
              }}
            />
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#6b7280"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                minHeight: 48,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#d1d5db",
                paddingHorizontal: 16,
              }}
            />
          </View>

          {issues.length > 0 && !isSubmitting ? (
            <View
              style={{
                marginTop: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#dc2626",
                padding: 10,
              }}
            >
              {issues.map((issue) => (
                <Text key={issue} style={{ fontSize: 12, color: "#dc2626" }}>
                  • {issue}
                </Text>
              ))}
            </View>
          ) : null}

          {error ? (
            <Text style={{ marginTop: 12, fontWeight: "600", color: "#dc2626" }}>
              {error}
            </Text>
          ) : null}

          <View style={{ marginTop: 16 }}>
            <AppButton
              onPress={() => void onLogin()}
              loading={isSubmitting}
              label={isSubmitting ? "Signing in..." : "Sign In"}
            />
          </View>

          <View style={{ marginTop: 12 }}>
            <AppButton onPress={() => router.push("/scan-invite")} variant="secondary" label="Scan QR" />
          </View>

          <View style={{ marginTop: 16, flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: "#6b7280" }}>Need an account? </Text>
            <Pressable onPress={() => router.push("/signup")}>
              <Text style={{ fontWeight: "700" }}>Sign up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
