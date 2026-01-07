import { View, Text, Button } from "react-native";
import { Link, useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View style={{ padding: 24 }}>
      <Text>Home</Text>

      <Link href="/(patient)/settings" style={{ marginTop: 16 }}>
        settings
      </Link>
    </View>
  );
}
