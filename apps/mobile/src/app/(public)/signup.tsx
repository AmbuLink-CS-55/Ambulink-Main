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
  StyleSheet,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const hospitalNames = [
  "City General Hospital",
  "St. Mary's Medical Center",
  "Central Valley Clinic",
  "Westside Community Hospital",
  "East Ridge Health System",
  "General Hospital",
  "Emergency Care Unit",
];

type Role = "patient" | "driver" | "emt";

function RoleButton({
  type,
  label,
  icon,
  role,
  onSelect,
}: {
  type: Role;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  role: Role;
  onSelect: (next: Role) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(type)}
      style={[styles.roleButton, role === type && styles.roleButtonActive]}
    >
      <Ionicons name={icon} size={24} color={role === type ? "white" : "#205fb7ff"} />
      <Text style={[styles.roleButtonText, role === type && styles.roleButtonTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StaffFields({
  staffId,
  hospitalName,
  setStaffId,
  onSelectHospital,
}: {
  staffId: string;
  hospitalName: string;
  setStaffId: (value: string) => void;
  onSelectHospital: () => void;
}) {
  return (
    <>
      <View style={styles.inputContainer}>
        <Ionicons name="id-card-outline" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.input}
          placeholder="Staff ID"
          value={staffId}
          onChangeText={setStaffId}
        />
      </View>
      <Pressable style={styles.inputContainer} onPress={onSelectHospital}>
        <Ionicons name="business-outline" size={20} color="#9CA3AF" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ fontSize: 16, color: hospitalName ? "#1F2937" : "#9CA3AF" }}>
            {hospitalName || "Select Hospital Name"}
          </Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
      </Pressable>
    </>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Details, 2: OTP
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [staffId, setStaffId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHospitalModal, setShowHospitalModal] = useState(false);

  const handleNext = () => {
    const isStaff = role === "driver" || role === "emt";
    if (!firstName || !lastName || !phone || !agreed || (isStaff && (!staffId || !hospitalName)))
      return;
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
  return (
    <>
      <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            className="px-6"
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <Pressable
                onPress={() => (step === 2 ? setStep(1) : router.back())}
                style={styles.backButton}
              >
                <Ionicons name="arrow-back" size={24} color="#1F2937" />
              </Pressable>
              <Text style={styles.headerTitle}>Create Account</Text>
            </View>

            {step === 1 ? (
              <View style={styles.formContainer}>
                <Text style={styles.title}>Join AmbuLink</Text>

                {/* First Name */}
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                  />
                </View>

                {/* Last Name */}
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                  />
                </View>

                {/* Phone Input */}
                <View style={styles.inputContainer}>
                  <Ionicons name="call-outline" size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    keyboardType="phone-pad"
                    value={phone}
                    onChangeText={setPhone}
                  />
                </View>

                {/* Role Selection */}
                <Text style={styles.label}>Sign up as:</Text>
                <View style={styles.roleContainer}>
                  <RoleButton
                    type="patient"
                    label="Patient"
                    icon="person-outline"
                    role={role}
                    onSelect={setRole}
                  />
                  <RoleButton
                    type="driver"
                    label="Driver"
                    icon="car-outline"
                    role={role}
                    onSelect={setRole}
                  />
                  <RoleButton
                    type="emt"
                    label="EMT"
                    icon="medkit-outline"
                    role={role}
                    onSelect={setRole}
                  />
                </View>

                {(role === "driver" || role === "emt") && (
                  <StaffFields
                    staffId={staffId}
                    hospitalName={hospitalName}
                    setStaffId={setStaffId}
                    onSelectHospital={() => setShowHospitalModal(true)}
                  />
                )}

                {/* Terms & Conditions */}
                <Pressable
                  style={styles.termsContainer}
                  onPress={() => setAgreed((prev) => !prev)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: agreed }}
                  accessibilityLabel="Agree to terms and conditions"
                >
                  <View style={[styles.checkbox, agreed && styles.checkboxActive]}>
                    {agreed && <Ionicons name="checkmark" size={16} color="white" />}
                  </View>
                  <Text style={styles.termsText}>
                    I agree to the <Text style={styles.termsLink}>Terms and Conditions</Text>
                  </Text>
                </Pressable>

                {/* Next Button */}
                <Pressable
                  onPress={handleNext}
                  disabled={
                    !firstName ||
                    !lastName ||
                    !phone ||
                    !agreed ||
                    loading ||
                    ((role === "driver" || role === "emt") && (!staffId || !hospitalName))
                  }
                  style={[
                    styles.primaryButton,
                    (!firstName ||
                      !lastName ||
                      !phone ||
                      !agreed ||
                      loading ||
                      ((role === "driver" || role === "emt") && (!staffId || !hospitalName))) &&
                      styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.buttonText}>{loading ? "Processing..." : "Next"}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.otpIconContainer}>
                  <Ionicons name="shield-checkmark-outline" size={80} color="#205fb7ff" />
                </View>
                <Text style={styles.title}>Verify Phone</Text>
                <Text style={styles.subtitle}>We`ve sent a 4-digit code to {phone}</Text>

                <View style={styles.otpContainer}>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="0000"
                    keyboardType="number-pad"
                    maxLength={4}
                    value={otp}
                    onChangeText={setOtp}
                    accessibilityLabel="One-time password"
                  />
                </View>

                <Pressable
                  style={styles.resendContainer}
                  onPress={() => Alert.alert("Resend", "OTP resend is not implemented yet.")}
                >
                  <Text style={styles.resendText}>
                    Didn`t receive code? <Text style={styles.resendLink}>Resend</Text>
                  </Text>
                </Pressable>

                <Pressable
                  onPress={handleVerify}
                  disabled={otp.length < 4 || loading}
                  style={[
                    styles.primaryButton,
                    (otp.length < 4 || loading) && styles.buttonDisabled,
                  ]}
                >
                  <Text style={styles.buttonText}>
                    {loading ? "Verifying..." : "Verify & Sign Up"}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Pressable onPress={() => router.push("/(public)/login_modern")}>
                <Text style={styles.footerLink}>Log In</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Hospital Selection Modal */}
      <Modal
        visible={showHospitalModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowHospitalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Hospital</Text>
              <Pressable onPress={() => setShowHospitalModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </Pressable>
            </View>
            <FlatList
              data={hospitalNames}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.hospitalItem}
                  onPress={() => {
                    setHospitalName(item);
                    setShowHospitalModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.hospitalItemText,
                      hospitalName === item && styles.hospitalItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {hospitalName === item && (
                    <Ionicons name="checkmark-circle" size={22} color="#205fb7ff" />
                  )}
                </Pressable>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 16,
    color: "#1F2937",
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 32,
  },
  row: {
    flexDirection: "row",
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: "#d9e9fdff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#79a5fcff",
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: "#1F2937",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
    marginTop: 8,
  },
  roleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  roleButton: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  roleButtonActive: {
    backgroundColor: "#205fb7ff",
    borderColor: "#205fb7ff",
  },
  roleButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: "600",
    color: "#205fb7ff",
  },
  roleButtonTextActive: {
    color: "white",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "60%",
    paddingTop: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
  },
  hospitalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  hospitalItemText: {
    fontSize: 16,
    color: "#374151",
  },
  hospitalItemTextActive: {
    color: "#205fb7ff",
    fontWeight: "600",
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#205fb7ff",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: "#205fb7ff",
  },
  termsText: {
    fontSize: 14,
    color: "#6B7280",
  },
  termsLink: {
    color: "#205fb7ff",
    fontWeight: "600",
  },
  primaryButton: {
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
  },
  buttonDisabled: {
    backgroundColor: "#9CA3AF",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  otpIconContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
  },
  otpContainer: {
    marginBottom: 24,
  },
  otpInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    height: 80,
    textAlign: "center",
    fontSize: 32,
    fontWeight: "bold",
    color: "#205fb7ff",
    letterSpacing: 20,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  resendText: {
    fontSize: 14,
    color: "#6B7280",
  },
  resendLink: {
    color: "#205fb7ff",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 40,
  },
  footerText: {
    color: "#6B7280",
    fontSize: 15,
  },
  footerLink: {
    color: "#205fb7ff",
    fontSize: 15,
    fontWeight: "600",
  },
});
