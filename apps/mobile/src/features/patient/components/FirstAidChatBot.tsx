import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { env } from "@/../env";

const GEMINI_API_KEY = env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

type Message = {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

const INITIAL_MESSAGE: Message = {
  id: '1',
  text: 'Hello! I am your AmbuLink First Aid Assistant. How can I help you today? You can ask me about CPR, Choking, Bleeding, Burns, or Heart Attacks.',
  sender: 'bot',
  timestamp: new Date(),
};

export default function FirstAidChatBot({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Manual history management for the REST API
  const history = useRef<{ role: string; parts: { text: string }[] }[]>([
    {
      role: "user",
      parts: [{ text: "Hello, I might need first aid help." }],
    },
    {
      role: "model",
      parts: [{ text: INITIAL_MESSAGE.text }],
    },
  ]);

  const handleSend = async () => {
    if (inputText.trim() === '') return;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "My API key is missing or expired! Please obtain a new Gemini API Key from Google AI Studio and configure it in the `.env` file as EXPO_PUBLIC_GEMINI_API_KEY.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setInputText('');
      return;
    }

    const userTextInput = inputText.trim();
    const userMessage: Message = {
      id: Date.now().toString(),
      text: userTextInput,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      // Add user message to history
      history.current.push({
        role: "user",
        parts: [{ text: userTextInput }],
      });

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: history.current,
          systemInstruction: {
            parts: [{
              text: "You are the AmbuLink First Aid Assistant. Provide emergency first aid. CRITICAL RULES: 1. NEVER write paragraphs or pleasantries. 2. Provide ONLY a numbered list of the 3-4 most critical action steps. 3. Each step MUST be a single, short sentence. 4. DO NOT explain the 'why'. 5. Do not use markdown (no asterisks or hashes). 6. If critical, Step 1 is always 'Call 1990 immediately.'"
            }]
          }
        }),
      });

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const botResponse = data.candidates[0].content.parts[0].text;

        // Add model message to history
        history.current.push({
          role: "model",
          parts: [{ text: botResponse }],
        });

        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: botResponse,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(data.error?.message || "Invalid API response");
      }
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Error: ${error.message || "I'm having trouble connecting. Please try again or call 1990."}`,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [visible, messages, isTyping]);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View className="flex-1 bg-slate-50" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <TouchableOpacity onPress={onClose} className="w-10 h-10 items-center justify-center">
            <MaterialCommunityIcons name="chevron-left" size={32} color="#1e3a8a" />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-extrabold text-slate-900 text-center">First Aid Assistant</Text>
            <View className="flex-row items-center justify-center mt-0.5">
              <View className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5" />
              <Text className="text-[11px] font-semibold text-slate-500 uppercase">Always active</Text>
            </View>
          </View>
          <View className="w-10" />
        </View>

        {/* Chat Area */}
        <ScrollView
          ref={scrollViewRef}
          className="flex-1 px-4 py-2"
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((msg) => (
            <View
              key={msg.id}
              className={`flex-row mb-4 max-w-[85%] ${
                msg.sender === 'user' ? 'self-end justify-end' : 'self-start'
              }`}
            >
              {msg.sender === 'bot' && (
                <View className="w-8 h-8 rounded-full bg-black items-center justify-center mr-2 mt-1">
                  <MaterialCommunityIcons name="robot" size={20} color="white" />
                </View>
              )}
              <View
                className={`px-4 py-2.5 rounded-[20px] shadow-sm shadow-black/5 elevation-1 ${
                  msg.sender === 'user'
                    ? 'bg-black rounded-br-sm'
                    : 'bg-white rounded-bl-sm border border-slate-100'
                }`}
              >
                <Text
                  className={`text-[15px] leading-[22px] ${
                    msg.sender === 'user' ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {msg.text}
                </Text>
                <Text
                  className={`text-[10px] mt-1 self-end ${
                    msg.sender === 'user' ? 'text-white/70' : 'text-slate-400'
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {isTyping && (
            <View className="flex-row mb-4 max-w-[85%] self-start">
              <View className="w-8 h-8 rounded-full bg-black items-center justify-center mr-2 mt-1">
                <MaterialCommunityIcons name="robot" size={20} color="white" />
              </View>
              <View className="px-4 py-3 rounded-[20px] shadow-sm shadow-black/5 elevation-1 bg-white rounded-bl-sm border border-slate-100 justify-center">
                <ActivityIndicator size="small" color="#1e3a8a" />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View
            className="px-4 pt-3 bg-white border-t border-slate-100"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="flex-row items-center bg-slate-100 rounded-full px-4 py-2">
              <TextInput
                className={`flex-1 text-[15px] text-slate-900 max-h-[100px] ${
                  Platform.OS === 'ios' ? 'pt-2' : 'pt-1 pb-1'
                }`}
                placeholder="Ask about first aid..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={inputText.trim() === ''}
                className={`w-9 h-9 rounded-full items-center justify-center ml-2 ${
                  inputText.trim() === '' ? 'bg-slate-200' : 'bg-black'
                }`}
              >
                <MaterialCommunityIcons
                  name="send"
                  size={20}
                  color={inputText.trim() === '' ? '#94a3b8' : 'white'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
