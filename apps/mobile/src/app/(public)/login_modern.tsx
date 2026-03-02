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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/common/hooks/AuthContext";
import i18n from "@/common/i18n/i18n";
import { AppImage as Image } from "@/common/components";

export default function LoginModern() {
  const router = useRouter();
  const signInAs = useAuthStore((s) => s.signInAs);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // If already logged in, redirect
  if (user?.role === "patient") return <Redirect href="/(patient)/map" />;
  if (user?.role === "driver") return <Redirect href="/(driver)" />;
  if (user?.role === "emt") return <Redirect href="/(emt)/medical" />;

  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      signInAs("patient");
      setLoading(false);
    }, 1000);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          style={{ paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={{ alignItems: "center" }}>
            <Image
              // source={require("../../../assets/images/Gemini_Generated_Image_obcq05obcq05obcq-removebg-preview.png")}
              style={{ width: 600, height: 600, marginTop: -195 }}
              contentFit="contain"
            />
          </View>

          {/* Form Section */}
          <View style={{ paddingHorizontal: 20, marginTop: -150 }}>
            <Text
              style={{ fontSize: 22, fontWeight: "bold", color: "#205fb7ff", marginBottom: 30 }}
            >
              Log in
            </Text>

            {/* Email Input */}
            <View
              style={{
                backgroundColor: "#d9e9fdff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#79a5fcff",
                marginBottom: 16,
                paddingHorizontal: 16,
                height: 56,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
              <TextInput
                style={{ flex: 1, marginLeft: 12, fontSize: 16, color: "#1F2937" }}
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Password Input */}
            <View
              style={{
                backgroundColor: "#d9e9fdff",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#79a5fcff",
                marginBottom: 12,
                paddingHorizontal: 16,
                height: 56,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" />
              <TextInput
                style={{ flex: 1, marginLeft: 12, fontSize: 16, color: "#1F2937" }}
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <Pressable onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>

            {/* Forgot Password */}
            <Pressable
              onPress={() => Alert.alert("Coming Soon", "Password reset is not implemented yet.")}
              style={{ alignItems: "flex-start", marginBottom: 24 }}
            >
              <Text style={{ color: "#205fb7ff", fontSize: 13, fontWeight: "500" }}>
                Forgot Password?
              </Text>
            </Pressable>

            {/* Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              style={{
                backgroundColor: "#205fb7ff",
                borderRadius: 12,
                height: 56,
                justifyContent: "center",
                alignItems: "center",
                shadowColor: "#205fb7ff",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "bold" }}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>
          </View>

          {/* Divider with "Continue with" */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 20,
              paddingHorizontal: 20,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
            <Text style={{ marginHorizontal: 16, color: "#9CA3AF", fontSize: 14 }}>
              Continue with
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: "#E5E7EB" }} />
          </View>

          {/* Google Sign In Button */}
          <View style={{ paddingHorizontal: 20 }}>
            <Pressable
              style={{
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
              }}
            >
              <Image
                source={{
                  uri: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png",
                }}
                style={{ width: 24, height: 24, marginRight: 12 }}
                contentFit="contain"
              />
              <Text style={{ color: "#1F2937", fontSize: 16, fontWeight: "600" }}>
                Sign in with Google
              </Text>
            </Pressable>
          </View>

          {/* Footer */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
              marginTop: 32,
              marginBottom: 40,
            }}
          >
            <Text style={{ color: "#6B7280", fontSize: 15 }}>Don`t have an account? </Text>
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

            <Pressable onPress={() => router.push("/(public)/signup")}>
              <Text style={{ color: "#205fb7ff", fontSize: 15, fontWeight: "600" }}>Sign Up</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
