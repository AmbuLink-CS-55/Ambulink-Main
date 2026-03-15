import React, { useState } from "react";
import { View, TextInput, Button, StyleSheet } from "react-native";

interface Props {
  onSend: (message: string) => void;
}

const ChatInput: React.FC<Props> = ({ onSend }) => {
  const [text, setText] = useState<string>("");

  const handleSend = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <View style={styles.container}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Describe the injury..."
        style={styles.input}
      />
      <Button title="Send" onPress={handleSend} />
    </View>
  );
};

export default ChatInput;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    marginRight: 10,
    borderRadius: 8,
    padding: 8,
  },
});