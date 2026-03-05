import { Pressable, Text, TextInput, View, ActivityIndicator } from "react-native";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading?: boolean;
};

export default function EmtNoteComposer({ value, onChange, onSubmit, loading = false }: Props) {
  return (
    <View className="border-t border-border pt-3">
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Type a situation update..."
        placeholderTextColor="#94a3b8"
        multiline
        className="bg-card border border-border rounded-xl px-3 py-3 text-foreground min-h-20"
      />
      <Pressable
        disabled={loading}
        onPress={onSubmit}
        className={`mt-3 min-h-11 rounded-xl items-center justify-center ${loading ? "bg-emerald-300" : "bg-emerald-500"}`}
      >
        {loading ? <ActivityIndicator color="white" /> : <Text className="text-white font-bold">Send Note</Text>}
      </Pressable>
    </View>
  );
}
