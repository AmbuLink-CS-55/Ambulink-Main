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
    StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1); // 1: Details, 2: OTP
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [phone, setPhone] = useState("");
    const [role, setRole] = useState<"patient" | "driver" | "emt">("patient");
    const [agreed, setAgreed] = useState(false);
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        if (!agreed) return;
        setLoading(true);
        // Simulate sending OTP
        setTimeout(() => {
            setLoading(false);
            setStep(2);
        }, 1500);
    };

    const handleVerify = () => {
        setLoading(true);
        // Simulate OTP verification
        setTimeout(() => {
            setLoading(false);
            router.replace("/(public)/login_modern");
        }, 1500);
    };
}