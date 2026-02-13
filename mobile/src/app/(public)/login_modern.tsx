import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/hooks/AuthContext";

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
        // For now, this just defaults to patient if they use the form
        // In a real app, this would validate credentials
        setLoading(true);
        setTimeout(() => {
            signInAs("patient");
            setLoading(false);
        }, 1000);
    };



    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1"
            >
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1 }}
                    className="px-6"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header Section */}
                    <View style={{ alignItems: 'center', marginTop: 0, marginBottom: 0 }}>
                        <Image
                            source={require('../../../assets/images/Gemini_Generated_Image_obcq05obcq05obcq-removebg-preview.png')}
                            style={{ width: 600, height: 600, marginTop: -195 }}
                            resizeMode="contain"
                        />
                    </View>
                    {/* Form Section */}
                    <View style={{ paddingHorizontal: 20, marginTop: -100 }}>
                        {/* Email Input */}
                        <View style={{
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            marginBottom: 16,
                            paddingHorizontal: 16,
                            height: 56,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <Ionicons name="mail-outline" size={22} color="#9CA3AF" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    marginLeft: 12,
                                    fontSize: 16,
                                    color: '#1F2937'
                                }}
                                placeholder="Email"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {/* Password Input */}
                        <View style={{
                            backgroundColor: '#F9FAFB',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            marginBottom: 12,
                            paddingHorizontal: 16,
                            height: 56,
                            flexDirection: 'row',
                            alignItems: 'center'
                        }}>
                            <Ionicons name="lock-closed-outline" size={22} color="#9CA3AF" />
                            <TextInput
                                style={{
                                    flex: 1,
                                    marginLeft: 12,
                                    fontSize: 16,
                                    color: '#1F2937'
                                }}
                                placeholder="Password"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                            />
                            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                                <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={22} color="#9CA3AF" />
                            </TouchableOpacity>
                        </View>

                        {/* Forgot Password */}
                        <TouchableOpacity style={{ alignItems: 'flex-end', marginBottom: 24 }}>
                            <Text style={{ color: '#205fb7ff', fontSize: 14, fontWeight: '500' }}>Forgot Password?</Text>
                        </TouchableOpacity>

                        {/* Sign In Button */}
                        <TouchableOpacity
                            onPress={handleSignIn}
                            style={{
                                backgroundColor: '#205fb7ff',
                                borderRadius: 12,
                                height: 56,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#205fb7ff',
                                shadowOffset: { width: 0, height: 4 },
                                shadowOpacity: 0.3,
                                shadowRadius: 8,
                                elevation: 4
                            }}
                        >
                            <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                                {loading ? "Signing in..." : "Sign In"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Divider with "Continue with" */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 20, paddingHorizontal: 20 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                        <Text style={{ marginHorizontal: 16, color: '#9CA3AF', fontSize: 14 }}>Continue with</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#E5E7EB' }} />
                    </View>

                    {/* Google Sign In Button */}
                    <View style={{ paddingHorizontal: 20 }}>
                        <TouchableOpacity
                            style={{
                                backgroundColor: 'white',
                                borderRadius: 12,
                                height: 56,
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: '#E5E7EB',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.1,
                                shadowRadius: 2,
                                elevation: 2
                            }}
                        >
                            <Image
                                source={{ uri: 'https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png' }}
                                style={{ width: 24, height: 24, marginRight: 12 }}
                            />
                            <Text style={{ color: '#1F2937', fontSize: 16, fontWeight: '600' }}>Sign in with Google</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer */}
                    <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 32, marginBottom: 40 }}>
                        <Text style={{ color: '#6B7280', fontSize: 15 }}>Don't have an account? </Text>
                        <TouchableOpacity>
                            <Text style={{ color: '#205fb7ff', fontSize: 15, fontWeight: '600' }}>Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
