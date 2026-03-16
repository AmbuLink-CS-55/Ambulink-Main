import { useState } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";

type StaffInviteQrPayload = {
  type: "staff_invite";
  role: "DRIVER" | "EMT" | "DISPATCHER";
  inviteToken: string;
  invitedEmail?: string;
};

export default function ScanInviteScreen() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [handled, setHandled] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!permission?.granted) {
    void requestPermission();
    return (
      <SafeAreaView style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text>Requesting camera permission...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        style={{ flex: 1 }}
        barcodeScannerSettings={{
          barcodeTypes: ["qr"],
        }}
        onBarcodeScanned={(event) => {
          if (handled) return;
          try {
            const parsed = JSON.parse(event.data) as StaffInviteQrPayload;
            if (parsed.type !== "staff_invite" || !parsed.inviteToken) {
              throw new Error("Invalid QR payload");
            }
            setHandled(true);
            const params = new URLSearchParams({
              inviteToken: parsed.inviteToken,
              role: parsed.role,
            });
            router.replace(`/(public)/signup?${params.toString()}` as never);
          } catch {
            setError("Invalid invite QR. Please scan a valid staff invite.");
          }
        }}
      />
      <View style={{ position: "absolute", bottom: 24, left: 16, right: 16 }}>
        <Text style={{ color: "#fff", textAlign: "center", fontWeight: "600" }}>
          Scan staff onboarding QR
        </Text>
        {error ? (
          <Text style={{ color: "#fecaca", marginTop: 6, textAlign: "center" }}>{error}</Text>
        ) : null}
      </View>
    </SafeAreaView>
  );
}
