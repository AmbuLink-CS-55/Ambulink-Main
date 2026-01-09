import { View, Text, Button } from "react-native";
import { useRouter } from "expo-router";

export default function Guid() {
  const router = useRouter();

  return (
    <View style={{ padding: 24 }}>
      <Text>Guide</Text>
      <Button title="Back" onPress={() => router.back()} />
    </View>
  );
}
