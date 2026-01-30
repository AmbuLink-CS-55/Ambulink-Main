import { View, Text, StyleSheet } from "react-native";

export default function Medical() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Medical Page</Text>
      <Text>EMT medical tools and info here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "bold" },
});