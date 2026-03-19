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
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <MaterialCommunityIcons name="chevron-left" size={32} color="#1e3a8a" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>First Aid Assistant</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>Always active</Text>
            </View>
          </View>
          <View style={{ width: 40 }} />
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
              style={[
                styles.messageWrapper,
                msg.sender === 'user' ? styles.userWrapper : styles.botWrapper,
              ]}
            >
              {msg.sender === 'bot' && (
                <View style={styles.botAvatar}>
                  <MaterialCommunityIcons name="robot" size={20} color="white" />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  msg.sender === 'user' ? styles.userBubble : styles.botBubble,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === 'user' ? styles.userText : styles.botText,
                  ]}
                >
                  {msg.text}
                </Text>
                <Text
                  style={[
                    styles.timestamp,
                    msg.sender === 'user' ? styles.userTimestamp : styles.botTimestamp,
                  ]}
                >
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
            </View>
          ))}
          {isTyping && (
            <View style={[styles.messageWrapper, styles.botWrapper]}>
              <View style={styles.botAvatar}>
                <MaterialCommunityIcons name="robot" size={20} color="white" />
              </View>
              <View style={[styles.messageBubble, styles.botBubble, { paddingVertical: 12 }]}>
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
          <View style={[styles.inputContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Ask about first aid..."
                placeholderTextColor="#94a3b8"
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={inputText.trim() === ''}
                style={[
                  styles.sendButton,
                  inputText.trim() === '' && { backgroundColor: '#e2e8f0' },
                ]}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: 'white',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  botWrapper: {
    alignSelf: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 4,
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  userBubble: {
    backgroundColor: '#000000',
    borderBottomRightRadius: 4,
  },
  botBubble: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: 'white',
  },
  botText: {
    color: '#334155',
  },
  timestamp: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255,255,255,0.7)',
  },
  botTimestamp: {
    color: '#94a3b8',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    maxHeight: 100,
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
