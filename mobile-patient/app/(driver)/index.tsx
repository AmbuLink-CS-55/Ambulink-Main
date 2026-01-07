import { View, Text, Button } from "react-native";
import { Link, useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View style={{ padding: 24 }}>
      <Text>Home</Text>

      <Button
        title="Go to Details (imperative)"
        onPress={() => router.push("/details")}
      />

      <Link href="/guid" style={{ marginTop: 16 }}>
        Go to Details (Link)
      </Link>
    </View>
  );
}
