import React, { useState } from "react";
import { SafeAreaView, FlatList } from "react-native";
import ChatMessage from "../../features/patient/components/ChatMessage";
import ChatInput from "../../features/patient/components/ChatInput";
import { Message } from "../../common/utils/Message";
import { getFirstAidResponse } from "../../common/tasks/gemini";

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);

  const handleSend = async (text: string) => {
    const userMessage: Message = {
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    const response = await getFirstAidResponse(text);

    const botMessage: Message = {
      role: "assistant",
      content: response,
    };

    setMessages((prev) => [...prev, botMessage]);
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <FlatList
        data={messages}
        renderItem={({ item }) => <ChatMessage message={item} />}
        keyExtractor={(_, index) => index.toString()}
        contentContainerStyle={{ padding: 10 }}
      />

      <ChatInput onSend={handleSend} />
    </SafeAreaView>
  );
}