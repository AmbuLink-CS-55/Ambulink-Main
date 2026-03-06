import { Pressable, Text, TextInput, View, ActivityIndicator, StyleSheet } from "react-native";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export default function EmtNoteComposer({ value, onChange, onSubmit, loading = false }: Props) {
  return (
    <View style={styles.wrapper}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Type a situation update..."
        placeholderTextColor="#94a3b8"
        multiline
        blurOnSubmit={false}
        textAlignVertical="top"
        style={styles.input}
      />
      <Pressable
        disabled={loading}
        onPress={onSubmit}
        style={[styles.button, loading && styles.buttonDisabled]}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={styles.buttonText}>Send Note</Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FCFCFC",
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#000000",
    fontSize: 14,
    minHeight: 80,
    maxHeight: 120,
  },
  button: {
    marginTop: 12,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
  },
  buttonDisabled: {
    backgroundColor: "#6ee7b7",
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
});
