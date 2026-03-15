import { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { useAuthStore } from "@/common/hooks/AuthContext";
import { loginStaff, toMobileAuthErrorMessage, type MobileStaffRole } from "@/common/lib/staffAuth";

type RoleOption = {
  role: MobileStaffRole;
  label: string;
};

const ROLE_OPTIONS: RoleOption[] = [
  { role: "DRIVER", label: "Driver" },
  { role: "EMT", label: "EMT" },
];

export default function LoginModern() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const signInStaff = useAuthStore((state) => state.signInStaff);
  const signInAs = useAuthStore((state) => state.signInAs);
  const hydrated = useAuthStore((state) => state.hydrated);

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

  if (!hydrated) {
    return null;
  }

  if (user?.role === "patient") return <Redirect href="/(patient)/map" />;
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
      router.replace("/");
    } catch (loginError) {
      console.error("[mobile-auth] login failed", loginError);
      setError(toMobileAuthErrorMessage(loginError, "Login failed. Check credentials and try again."));
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
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, justifyContent: "center" }}>
          <Text style={{ fontSize: 32, fontWeight: "700", color: "#0f172a" }}>AmbuLink Staff</Text>
          <Text style={{ marginTop: 8, fontSize: 15, color: "#475569" }}>
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
                    borderWidth: 1,
                    borderColor: active ? "#0f172a" : "#cbd5e1",
                    backgroundColor: active ? "#0f172a" : "#fff",
                    borderRadius: 12,
                    minHeight: 46,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: active ? "#fff" : "#0f172a", fontWeight: "700" }}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ marginTop: 18, gap: 10 }}>
            <TextInput
              placeholder="Enter your email"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 12,
                minHeight: 52,
                paddingHorizontal: 14,
                color: "#0f172a",
              }}
            />
            <TextInput
              placeholder="Enter your password"
              placeholderTextColor="#64748b"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={{
                borderWidth: 1,
                borderColor: "#cbd5e1",
                borderRadius: 12,
                minHeight: 52,
                paddingHorizontal: 14,
                color: "#0f172a",
              }}
            />
          </View>

          {issues.length > 0 && !isSubmitting ? (
            <View
              style={{
                marginTop: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#fecaca",
                backgroundColor: "#fef2f2",
                padding: 10,
                gap: 2,
              }}
            >
              {issues.map((issue) => (
                <Text key={issue} style={{ color: "#991b1b", fontSize: 12 }}>
                  • {issue}
                </Text>
              ))}
            </View>
          ) : null}

          {error ? <Text style={{ marginTop: 12, color: "#b91c1c", fontWeight: "600" }}>{error}</Text> : null}

          <Pressable
            onPress={() => void onLogin()}
            disabled={isSubmitting}
            style={{
              marginTop: 16,
              borderRadius: 12,
              minHeight: 52,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSubmitting ? "#94a3b8" : "#0f172a",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Text>
          </Pressable>

          <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: "#475569" }}>Need an account? </Text>
            <Pressable onPress={() => router.push("/(public)/signup")}>
              <Text style={{ color: "#0f172a", fontWeight: "700" }}>Sign up</Text>
            </Pressable>
          </View>

          <Pressable
            onPress={() => {
              signInAs("patient");
              router.replace("/(patient)/map");
            }}
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={{ color: "#0f172a", fontWeight: "700" }}>Continue As Patient</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(public)/scan-invite" as never)}
            style={{ marginTop: 10, alignItems: "center" }}
          >
            <Text style={{ color: "#334155", fontWeight: "600" }}>Scan Staff Invite QR</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
