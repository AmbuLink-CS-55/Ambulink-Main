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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/common/hooks/AuthContext";
import { AppImage as Image } from "@/common/components/AppImage";

/**
 * LoginModern Component
 * This is the main screen handle user logins for the application.
 * It is built to be responsive and keyboard-friendly for mobile devices.
 */
export default function LoginModern() {
  // `useRouter` is an Expo Router hook used for programmatic navigation between screens (e.g. pushing to signup).
  const router = useRouter();

  // Accessing our global authentication state management (Zustand store).
  // `signInAs` is the function to log a user in as a specific role.
  // `user` contains the currently logged-in user object.
  const signInAs = useAuthStore((s) => s.signInAs);
  const user = useAuthStore((s) => s.user);

  // React state hooks to control the input forms
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // UI state hooks to toggle password visibility and show loading spinners
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- AUTOMATIC REDIRECTION ---
  // If a user is already authenticated and visits the public login page, 
  // we immediately intercept them and redirect them to their respective dashboards based on their role.
  if (user?.role === "patient") return <Redirect href="/(patient)/map" />;
  if (user?.role === "driver") return <Redirect href="/(driver)" />;
  if (user?.role === "emt") return <Redirect href={"/(emt)" as never} />;

  /**
   * Function to handle the standard sign in process.
   * Right now, it simulates a network request using a 1-second timeout
   * before signing the user in as a default "patient".
   */
  const handleSignIn = () => {
    setLoading(true);
    setTimeout(() => {
      signInAs("patient");
      setLoading(false);
    }, 1000);
  };

  return (
    // SafeAreaView ensures our content doesn't render behind the notch or status bar
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      
      {/* 
        KeyboardAvoidingView makes sure the UI automatically shifts up 
        when the phone's software keyboard opens, so inputs aren't blocked. 
      */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {/* --- TOP HEADER SECTION --- */}
          <View className="w-full items-center">
            {/* The main app branding / cover image */}
            <Image
              source={require("../../../assets/images/Ambulinkcover.png")}
              style={{ width: "180%", aspectRatio: 1, alignSelf: "center", marginTop: -220 }}
              contentFit="contain"
            />
          </View>

          {/* --- MAIN LOGIN FORM SECTION --- */}
          <View className="px-5" style={{ marginTop: -150 }}>
            {/* Screen Title */}
            <Text className="font-bold" style={{ fontSize: 26, color: "#1e5bb5", marginBottom: 30 }}>
              Log in
            </Text>

            {/* Email Input Field */}
            <View className="rounded-xl border mb-4 px-4 flex-row items-center" style={{ backgroundColor: "#e2eefa", borderColor: "#a8c7fa", height: 56 }}>
              <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Email"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address" // Shows correct keyboard type (with @ symbol)
                spellCheck={false}
                accessibilityLabel="Email"
              />
            </View>

            {/* Password Input Field */}
            <View className="rounded-xl border mb-4 px-4 flex-row items-center" style={{ backgroundColor: "#e2eefa", borderColor: "#a8c7fa", height: 56 }}>
              <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
                placeholder="Password"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword} // secureTextEntry hides the password bullets
                accessibilityLabel="Password"
              />
              {/* Toggle Password Visibility Button */}
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? "Hide password" : "Show password"}
                hitSlop={10} // hitSlop makes the button easier to tap by increasing touch area
              >
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={22}
                  color="#9CA3AF"
                />
              </Pressable>
            </View>

            {/* Forgot Password Button */}
            <Pressable
              onPress={() => Alert.alert("Coming Soon", "Password reset is not implemented yet.")}
              className="items-start mb-6"
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text className="font-bold" style={{ color: "#1e5bb5", fontSize: 13 }}>
                Forgot Password?
              </Text>
            </Pressable>

            {/* Main Sign In Button */}
            <Pressable
              onPress={handleSignIn}
              className="rounded-xl justify-center items-center"
              style={{ backgroundColor: "#1e5bb5", height: 56, shadowColor: "#1e5bb5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text className="text-white font-bold" style={{ fontSize: 18 }}>
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>
          </View>

          {/* --- SOCIAL LOGIN SECTION --- */}
          <View className="flex-row items-center my-5 px-5">
            {/* Visual dividers for "Continue with" text */}
            <View className="flex-1" style={{ height: 1, backgroundColor: "#E5E7EB" }} />
            <Text className="mx-4 text-sm" style={{ color: "#9CA3AF" }}>Continue with</Text>
            <View className="flex-1" style={{ height: 1, backgroundColor: "#E5E7EB" }} />
          </View>

          {/* Google Single Sign-On (SSO) Button */}
          <View className="px-5">
            <Pressable
              className="bg-white rounded-xl flex-row justify-center items-center border h-14 border-gray-200 shadow-sm elevation-3 active:opacity-70"
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
            >
              <Image
                source={{
                  uri: "https://developers.google.com/identity/images/g-logo.png",
                }}
                style={{ width: 28, height: 28, marginRight: 12 }}
                contentFit="contain"
              />
              <Text className="font-bold text-[16px] text-[#374151]">
                Continue with Google
              </Text>
            </Pressable>
          </View>

          {/* --- NAVIGATION TO SIGN UP --- */}
          <View className="flex-row justify-center items-center mt-6 mb-5">
            <Text style={{ color: "#6B7280", fontSize: 15 }}>
              Don&apos;t have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(public)/signup")}>
              <Text className="font-bold" style={{ color: "#1e5bb5", fontSize: 15 }}>Sign Up</Text>
            </Pressable>
          </View>

          {/* --- DEVELOPER MODE / SHORTCUTS SECTION --- */}
          {/* This section allows testers/developers to instantly bypass standard login and inject themselves directly into the app as a specific role type */}
          <View className="mx-5 border-dashed rounded-2xl p-4" style={{ marginBottom: 60, borderWidth: 1.5, borderColor: "#ed8936", backgroundColor: "#fffdfa" }}>
            <View className="flex-row items-center justify-center mb-4">
              <Ionicons name="construct" size={14} color="#ed8936" />
              <Text className="text-xs font-bold" style={{ color: "#ed8936", letterSpacing: 1 }}>
                {"  "}DEV MODE — QUICK SIGN-IN
              </Text>
            </View>
            
            <View className="flex-row justify-between">
              {/* Dev Mode: Patient Shortcut */}
              <Pressable
                className="flex-1 mx-1.5 rounded-xl justify-center items-center"
                style={{ aspectRatio: 1.1, backgroundColor: "#1e5bb5" }}
                onPress={() => {
                  signInAs("patient");
                  router.replace("/");
                }}
              >
                <Ionicons name="person" size={24} color="white" />
                <Text className="text-white font-semibold mt-1.5" style={{ fontSize: 13 }}>
                  Patient
                </Text>
              </Pressable>
              
              {/* Dev Mode: Driver Shortcut */}
              <Pressable
                className="flex-1 mx-1.5 rounded-xl justify-center items-center"
                style={{ aspectRatio: 1.1, backgroundColor: "#22a95c" }}
                onPress={() => {
                  signInAs("driver");
                  router.replace("/");
                }}
              >
                <Ionicons name="car" size={24} color="white" />
                <Text className="text-white font-semibold mt-1.5" style={{ fontSize: 13 }}>
                  Driver
                </Text>
              </Pressable>

              {/* Dev Mode: EMT Shortcut */}
              <Pressable
                className="flex-1 mx-1.5 rounded-xl justify-center items-center"
                style={{ aspectRatio: 1.1, backgroundColor: "#8d4af9" }}
                onPress={() => {
                  signInAs("emt");
                  router.replace("/");
                }}
              >
                <Ionicons name="medkit" size={24} color="white" />
                <Text className="text-white font-semibold mt-1.5" style={{ fontSize: 13 }}>
                  EMT
                </Text>
              </Pressable>
            </View>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
