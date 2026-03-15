import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/common/hooks/AuthContext";

export default function DriverSettingsScreen() {
  const router = useRouter();
  const signOut = useAuthStore((state) => state.signOut);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 28, fontWeight: "700", color: "#0f172a" }}>Settings</Text>
        <Pressable
          onPress={() =>
            void signOut().then(() => {
              router.replace("/(public)/login_modern");
            })
          }
          style={{
            marginTop: 20,
            borderRadius: 12,
            minHeight: 52,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f172a",
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
