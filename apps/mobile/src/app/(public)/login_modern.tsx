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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="w-full items-center">
            <Image
              source={require("../../../assets/images/Ambulinkcover.png")}
              style={{ width: "180%", aspectRatio: 1, alignSelf: "center", marginTop: -220 }}
              contentFit="contain"
            />
          </View>

          <View className="px-5" style={{ marginTop: -150 }}>
            <Text className="font-black mb-[30px]" style={{ fontSize: 26, color: "#1e5bb5" }}>
              Log in
            </Text>

            <View className="rounded-xl border mb-4 px-4 flex-row items-center" style={{ backgroundColor: "#e2eefa", borderColor: "#a8c7fa", height: 56 }}>
              <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
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

            <View className="rounded-xl border mb-4 px-4 flex-row items-center" style={{ backgroundColor: "#e2eefa", borderColor: "#a8c7fa", height: 56 }}>
              <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-3 text-base text-gray-800"
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
              className="items-start mb-6"
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
            >
              <Text className="font-bold" style={{ color: "#1e5bb5", fontSize: 13 }}>
                Forgot Password?
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSignIn}
              className="rounded-xl justify-center items-center shadow-lg"
              style={{ backgroundColor: "#1e5bb5", height: 56, shadowColor: "#1e5bb5", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
            >
              <Text className="text-white text-[18px] font-bold">
                {loading ? "Signing in..." : "Sign In"}
              </Text>
            </Pressable>
          </View>

          <View className="flex-row items-center my-5 px-5">
            <View className="flex-1" style={{ height: 1, backgroundColor: "#E5E7EB" }} />
            <Text className="mx-4 text-sm" style={{ color: "#9CA3AF" }}>Continue with</Text>
            <View className="flex-1" style={{ height: 1, backgroundColor: "#E5E7EB" }} />
          </View>

          <View className="px-5">
            <Pressable
              className="bg-white rounded-xl flex-row justify-center items-center border shadow-sm"
              style={{ height: 56, borderColor: "#E5E7EB", elevation: 2 }}
              accessibilityRole="button"
              accessibilityLabel="Sign in with Google"
            >
              <Image
                source={{
                  uri: "https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png",
                }}
                className="w-6 h-6 mr-3"
                contentFit="contain"
              />
              <Text className="text-base font-semibold" style={{ color: "#1F2937" }}>
                Sign in with Google
              </Text>
            </Pressable>
          </View>

          <View className="flex-row justify-center items-center mt-6 mb-5">
            <Text style={{ color: "#6B7280", fontSize: 15 }}>
              Don&apos;t have an account?{" "}
            </Text>
            <Pressable onPress={() => router.push("/(public)/signup")}>
              <Text className="font-bold" style={{ color: "#1e5bb5", fontSize: 15 }}>Sign Up</Text>
            </Pressable>
          </View>

          <View className="mx-5 border-dashed rounded-2xl p-4" style={{ marginBottom: 60, borderWidth: 1.5, borderColor: "#ed8936", backgroundColor: "#fffdfa" }}>
            <View className="flex-row items-center justify-center mb-4">
              <Ionicons name="construct" size={14} color="#ed8936" />
              <Text className="text-xs font-bold tracking-widest" style={{ color: "#ed8936" }}>
                {"  "}DEV MODE — QUICK SIGN-IN
              </Text>
            </View>
            <View className="flex-row justify-between">
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
