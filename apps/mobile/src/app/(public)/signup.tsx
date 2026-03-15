import { useEffect, useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  activateStaffInvite,
  previewStaffInvite,
  toMobileAuthErrorMessage,
} from "@/common/lib/staffAuth";
import { useAuthStore } from "@/common/hooks/AuthContext";

type DeepLinkParams = {
  inviteToken?: string | string[];
};

function readParam(value: string | string[] | undefined) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value[0] ?? "";
  return "";
}

export default function SignupPage() {
  const router = useRouter();
  const params = useLocalSearchParams<DeepLinkParams>();
  const signInStaff = useAuthStore((state) => state.signInStaff);

  const [inviteToken, setInviteToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invitedEmail, setInvitedEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
  const [isPreviewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const tokenFromLink = readParam(params.inviteToken).trim();
    if (tokenFromLink) {
      setInviteToken(tokenFromLink);
    }
  }, [params.inviteToken]);

  useEffect(() => {
    if (!inviteToken.trim()) {
      setInvitedEmail(null);
      setRole(null);
      return;
    }

    let mounted = true;
    setPreviewLoading(true);
    previewStaffInvite(inviteToken.trim())
      .then((preview) => {
        if (!mounted) return;
        if (!preview.valid) {
          setError("Invite is invalid or expired.");
          setInvitedEmail(null);
          setRole(null);
          return;
        }
        setError(null);
        setInvitedEmail(preview.invitedEmail);
        setRole(preview.role);
      })
      .catch((previewError) => {
        if (!mounted) return;
        setError(toMobileAuthErrorMessage(previewError, "Failed to load invite."));
      })
      .finally(() => {
        if (mounted) setPreviewLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [inviteToken]);

  const issues = useMemo(() => {
    const next: string[] = [];
    if (!inviteToken.trim()) next.push("Invite token is required.");
    if (password.length < 8) next.push("Password must be at least 8 characters.");
    if (confirmPassword.length < 8) next.push("Confirm password is required.");
    if (password && confirmPassword && password !== confirmPassword) {
      next.push("Passwords do not match.");
    }
    return next;
  }, [confirmPassword, inviteToken, password]);

  const onActivate = async () => {
    if (issues.length > 0) {
      setError(issues[0] ?? "Please complete the form.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const session = await activateStaffInvite({
        inviteToken: inviteToken.trim(),
        password,
        confirmPassword,
      });
      await signInStaff(session);
      router.replace("/");
    } catch (activateError) {
      console.error("[mobile-auth] invite activate failed", activateError);
      setError(toMobileAuthErrorMessage(activateError, "Invite activation failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <Text style={{ fontSize: 30, fontWeight: "700", color: "#0f172a" }}>Activate Staff Invite</Text>
          <Text style={{ marginTop: 8, color: "#475569" }}>
            Set your password to activate your driver or EMT account.
          </Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            <View style={[inputStyle, { justifyContent: "center", backgroundColor: "#f8fafc" }]}>
              <Text style={{ color: "#0f172a" }}>
                {inviteToken.trim() ? "Invite token captured from QR/link." : "Waiting for invite token..."}
              </Text>
            </View>

            <View style={[inputStyle, { justifyContent: "center", backgroundColor: "#f8fafc" }]}>
              <Text style={{ color: "#0f172a" }}>
                {isPreviewLoading ? "Loading invite..." : `Assigned email: ${invitedEmail ?? "N/A"}`}
              </Text>
            </View>

            <View style={[inputStyle, { justifyContent: "center", backgroundColor: "#f8fafc" }]}>
              <Text style={{ color: "#0f172a" }}>Role: {role ?? "N/A"}</Text>
            </View>

            <TextInput
              placeholder="Create password"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={inputStyle}
            />
            <TextInput
              placeholder="Confirm password"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={inputStyle}
            />
          </View>

          {issues.length > 0 ? (
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

          {error ? <Text style={{ marginTop: 10, color: "#b91c1c", fontWeight: "600" }}>{error}</Text> : null}

          <Pressable
            onPress={() => void onActivate()}
            disabled={isSubmitting || isPreviewLoading || role === "DISPATCHER"}
            style={{
              marginTop: 14,
              borderRadius: 12,
              minHeight: 52,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSubmitting ? "#94a3b8" : "#0f172a",
            }}
          >
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "700" }}>
              {isSubmitting ? "Activating..." : "Activate Account"}
            </Text>
          </Pressable>

          <View style={{ marginTop: 14, flexDirection: "row", justifyContent: "center" }}>
            <Text style={{ color: "#475569" }}>Already have an account? </Text>
            <Pressable onPress={() => router.push("/(public)/login_modern")}>
              <Text style={{ color: "#0f172a", fontWeight: "700" }}>Log in</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const inputStyle = {
  borderWidth: 1,
  borderColor: "#cbd5e1",
  borderRadius: 12,
  minHeight: 52,
  paddingHorizontal: 14,
  color: "#0f172a",
} as const;
