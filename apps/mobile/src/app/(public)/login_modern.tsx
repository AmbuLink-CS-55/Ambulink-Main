import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Button,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/common/hooks/AuthContext";
import i18n from "@/common/i18n/i18n";
import { AppImage as Image } from "@/common/components/AppImage";

export default function LoginModern() {
  const router = useRouter();
  const signInAs = useAuthStore((s) => s.signInAs);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user?.role === "patient") return <Redirect href="/(patient)/map" />;
  if (user?.role === "driver") return <Redirect href="/(driver)" />;
  if (user?.role === "emt") return <Redirect href={"/(emt)" as never} />;

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      signInAs("patient");
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex1}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerSection}>
            <Image
              source={require("../../../assets/images/Ambulinkcover.png")}
              style={styles.headerImage}
              contentFit="contain"
            />
          </View>

          <View style={styles.formSection}>
            <Text style={styles.heading}>Log in</Text>

            <View style={styles.inputRow}>
              <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                spellCheck={false}
                accessibilityLabel="Email"
              />
            </View>

            <View style={styles.inputRow}>
              <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                accessibilityLabel="Password"
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={10}
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>

            <Pressable
              onPress={() => Alert.alert("Coming Soon", "Password reset is not implemented yet.")}
              style={styles.forgotButton}
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </Pressable>

            <Pressable
              onPress={handleSignIn}
              style={styles.signInButton}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text style={styles.signInText}>{loading ? "Signing in..." : "Sign In"}</Text>
            </Pressable>
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>Continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialSection}>
            <Pressable
              style={styles.googleButton}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <Image
                source={{
                  uri: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png",
                }}
                style={styles.googleLogo}
                contentFit="contain"
              />
              <Text style={styles.googleText}>Sign in with Google</Text>
            </Pressable>
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push("/(public)/signup")}>
              <Text style={styles.signupText}>Sign Up</Text>
            </Pressable>
          </View>

          <View style={styles.devModeBox}>
            <View style={styles.devModeHeader}>
              <Ionicons name="construct" size={14} color="#ed8936" />
              <Text style={styles.devModeHeaderText}>  DEV MODE — QUICK SIGN-IN</Text>
            </View>
            <View style={styles.devModeRow}>
              <Pressable
                style={[styles.devModeBtn, { backgroundColor: "#1e5bb5" }]}
                onPress={() => {
                  signInAs("patient");
                  router.replace("/");
                }}
              >
                <Ionicons name="person" size={24} color="white" />
                <Text style={styles.devModeBtnText}>Patient</Text>
              </Pressable>
              <Pressable
                style={[styles.devModeBtn, { backgroundColor: "#22a95c" }]}
                onPress={() => {
                  signInAs("driver");
                  router.replace("/");
                }}
              >
                <Ionicons name="car" size={24} color="white" />
                <Text style={styles.devModeBtnText}>Driver</Text>
              </Pressable>
              <Pressable
                style={[styles.devModeBtn, { backgroundColor: "#8d4af9" }]}
                onPress={() => {
                  signInAs("emt");
                  router.replace("/");
                }}
              >
                <Ionicons name="medkit" size={24} color="white" />
                <Text style={styles.devModeBtnText}>EMT</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "white" },
  flex1: { flex: 1 },
  scrollView: {},
  scrollContent: { flexGrow: 1 },
  headerSection: { width: "100%", alignItems: "center" },
  headerImage: { width: "180%", aspectRatio: 1.0, alignSelf: "center", marginTop: -220 },
  formSection: { paddingHorizontal: 20, marginTop: -150 },
  heading: { fontSize: 26, fontWeight: "900", color: "#1e5bb5", marginBottom: 30 },
  inputRow: {
    backgroundColor: "#e2eefa",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#a8c7fa",
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
  },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: "#1F2937" },
  forgotButton: { alignItems: "flex-start", marginBottom: 24 },
  forgotText: { color: "#1e5bb5", fontSize: 13, fontWeight: "700" },
  signInButton: {
    backgroundColor: "#1e5bb5",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#1e5bb5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  signInText: { color: "white", fontSize: 18, fontWeight: "bold" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { marginHorizontal: 16, color: "#9CA3AF", fontSize: 14 },
  socialSection: { paddingHorizontal: 20 },
  googleButton: {
    backgroundColor: "white",
    borderRadius: 12,
    height: 56,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  googleLogo: { width: 24, height: 24, marginRight: 12 },
  googleText: { color: "#1F2937", fontSize: 16, fontWeight: "600" },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 20,
  },
  footerText: { color: "#6B7280", fontSize: 15 },
  signupText: { color: "#1e5bb5", fontSize: 15, fontWeight: "700" },
  devModeBox: {
    marginBottom: 60,
    marginHorizontal: 20,
    borderWidth: 1.5,
    borderColor: "#ed8936",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    backgroundColor: "#fffdfa",
  },
  devModeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  devModeHeaderText: {
    color: "#ed8936",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  devModeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  devModeBtn: {
    flex: 1,
    aspectRatio: 1.1,
    marginHorizontal: 6,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  devModeBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 6,
  },
});
