import { View, Text, StyleSheet } from "react-native";

export default function Communication() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Communication Page</Text>
      <Text>EMT communication tools here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
});