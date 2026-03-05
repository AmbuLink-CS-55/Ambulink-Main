import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, TextInput, View } from "react-native";

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
};

export default function EmtSearchBar({ value, onChangeText, onClear }: Props) {
  return (
    <View className="bg-card rounded-xl border border-border px-3 py-2 shadow">
      <View className="flex-row items-center">
        <Ionicons name="search" size={18} color="#64748b" />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Search booking ID"
          placeholderTextColor="#94a3b8"
          className="flex-1 ml-2 text-foreground"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={onClear} accessibilityRole="button" accessibilityLabel="Clear booking search">
            <Ionicons name="close-circle" size={18} color="#64748b" />
          </Pressable>
        )}
      </View>
      <Text className="text-[11px] text-muted-foreground mt-1">EMT searches booking IDs locally from preloaded active options</Text>
    </View>
  );
}
