import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Message } from "../../../common/utils/Message";

interface Props {
  message: Message;
}

const ChatMessage: React.FC<Props> = ({ message }) => {
  const isUser = message.role === "user";

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.userContainer : styles.botContainer,
      ]}
    >
      <Text style={styles.text}>{message.content}</Text>
    </View>
  );
};

export default ChatMessage;

const styles = StyleSheet.create({
  container: {
    padding: 12,
    marginVertical: 6,
    borderRadius: 12,
    maxWidth: "80%",
  },
  userContainer: {
    alignSelf: "flex-end",
    backgroundColor: "#007AFF",
  },
  botContainer: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E5EA",
  },
  text: {
    color: "#000",
  },
});