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

  const handleSend = () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botResponse = getBotResponse(inputText);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const FIRST_AID_KNOWLEDGE: Record<string, { response: string, keywords: string[] }> = {
    cpr: {
      keywords: ['cpr', 'chest compression', 'heart stopped', 'not breathing', 'unresponsive'],
      response: "For Adult CPR:\n1. Call emergency services immediately.\n2. Place hands in the center of the chest.\n3. Push HARD and FAST (100–120 bpm).\n4. Allow chest to recoil perfectly between pushes.\n5. Continue until help arrives or the person recovers."
    },
    choking: {
      keywords: ['choke', 'choking', 'blockage', 'heimlich', 'can\'t breathe'],
      response: "For Choking (Conscious):\n1. Stand behind them and wrap your arms around their waist.\n2. Make a fist and place it just above the navel.\n3. Perform 5 quick, upward abdominal thrusts (Heimlich maneuver).\n4. Alternate with 5 firm back blows until the object is forced out."
    },
    bleeding: {
      keywords: ['bleed', 'blood', 'cut', 'wound', 'hemorrhage', 'injury'],
      response: "For Severe Bleeding:\n1. Apply firm, direct pressure with a clean cloth or bandage.\n2. Do NOT remove the cloth if it gets soaked; add more layers on top.\n3. Elevate the injured limb above heart level if possible.\n4. If bleeding is life-threatening and on a limb, consider a tourniquet."
    },
    burns: {
      keywords: ['burn', 'scald', 'fire', 'hot water', 'thermal'],
      response: "For Burns:\n1. Cool the burn under cool (not cold) running water for at least 10–20 minutes.\n2. Remove jewelry or tight clothing before the area swells.\n3. Cover loosely with sterile film or dressing.\n4. Do NOT use ice, butter, or ointments on a fresh burn."
    },
    heart_attack: {
      keywords: ['heart attack', 'chest pain', 'myocardial', 'angina', 'left arm pain'],
      response: "For Heart Attack:\n1. Call emergency services IMMEDIATELY.\n2. Have the person sit down and stay calm.\n3. Loosen tight clothing.\n4. If they have prescribed nitroglycerin, help them take it.\n5. Be ready to start CPR if they become unresponsive."
    },
    stroke: {
      keywords: ['stroke', 'face drooping', 'arm weakness', 'speech', 'fast', 'numbness'],
      response: "For Stroke (Think F.A.S.T.):\n- Face: Is one side drooping?\n- Arms: Can they raise both arms?\n- Speech: Is it slurred or strange?\n- Time: Call emergency services immediately if you see any of these signs."
    },
    seizure: {
      keywords: ['seizure', 'fit', 'convulsion', 'shaking', 'epilepsy'],
      response: "During a Seizure:\n1. Clear the area of hard or sharp objects.\n2. Place something soft under their head.\n3. Do NOT restrain them or put anything in their mouth.\n4. Turn them onto their side once the shaking stops to keep the airway clear."
    },
    poisoning: {
      keywords: ['poison', 'swallowed', 'toxic', 'chemical', 'overdose'],
      response: "For Poisoning:\n1. Try to identify what was taken and how much.\n2. Call emergency services or a poison control center immediately.\n3. Do NOT induce vomiting unless specifically told to do so by a medical professional."
    },
    fracture: {
      keywords: ['fracture', 'broken', 'bone', 'snap', 'joint'],
      response: "For Fractures/Broken Bones:\n1. Do NOT try to realign the bone.\n2. Keep the limb still and supported (using a splint if possible).\n3. Apply a cold pack (wrapped in a cloth) to reduce swelling.\n4. Seek professional medical attention immediately."
    },
    snake_bite: {
      keywords: ['snake', 'bite', 'venom', 'cobra', 'viper'],
      response: "For Snake Bites:\n1. Keep the person calm and still to slow venom spread.\n2. Keep the bite site at or below heart level.\n3. Do NOT cut the wound or try to suck out venom.\n4. Remove rings/watches before swelling occurs.\n5. Get to a hospital for anti-venom immediately."
    },
    heatstroke: {
      keywords: ['heat', 'heatstroke', 'exhaustion', 'sun', 'feverish'],
      response: "For Heatstroke:\n1. Move the person to a cool, shaded area.\n2. Remove unnecessary clothing.\n3. Cool them down quickly with wet cloths, ice packs (neck/armpits), or a cool bath.\n4. Call emergency services as this is a life-threatening emergency."
    },
    allergic_reaction: {
      keywords: ['allergy', 'allergic', 'sting', 'anaphylaxis', 'hive', 'swelling'],
      response: "For Severe Allergic Reaction (Anaphylaxis):\n1. Call emergency services immediately.\n2. Ask if they have an Epinephrine auto-injector (EpiPen) and help them use it if needed.\n3. Have them lie flat with legs raised.\n4. Monitor breathing closely."
    },
    drowning: {
      keywords: ['drown', 'water', 'submerged', 'pool'],
      response: "For Drowning:\n1. Get the person out of the water safely.\n2. Check for breathing and pulse.\n3. If not breathing, start CPR immediately (2 rescue breaths first, then 30 compressions).\n4. Even if they recover, they MUST go to a hospital due to risk of secondary drowning."
    },
    bee_sting: {
      keywords: ['bee', 'wasp', 'sting', 'insect'],
      response: "For Bee/Wasp Stings:\n1. Scrape the stinger out with a flat surface (like a credit card). Do NOT use tweezers.\n2. Wash the area with soap and water.\n3. Apply a cold pack to reduce swelling.\n4. Watch for signs of allergic reaction (difficulty breathing, swelling of face)."
    },
    animal_bite: {
      keywords: ['dog', 'cat', 'animal', 'bite'],
      response: "For Animal Bites:\n1. Clean the wound with soap and water for several minutes.\n2. Apply antibiotic ointment and a clean bandage.\n3. Seek medical attention, especially if the bite is deep or if you're unsure of the animal's rabies status."
    },
    nosebleed: {
      keywords: ['nose', 'bleed', 'nosebleed', 'nostril'],
      response: "For Nosebleeds:\n1. Sit upright and lean slightly FORWARD.\n2. Pinch the soft part of the nose shut for 10–15 minutes.\n3. Breathe through your mouth.\n4. Do NOT lean back as blood could go down your throat."
    },
    frostbite: {
      keywords: ['cold', 'frostbite', 'frozen', 'ice'],
      response: "For Frostbite:\n1. Move to a warm place.\n2. Remove wet clothing.\n3. Soak the affected area in warm (NOT hot) water.\n4. Do NOT rub the area or use direct heat (like a heating pad)."
    }
  };

  const getBotResponse = (text: string): string => {
    const query = text.toLowerCase();
    
    // Check for "hi" / "hello"
    if (['hi', 'hello', 'hey', 'help'].some(w => query === w || query.startsWith(w + ' '))) {
      return "Hello! I'm your First Aid Assistant. I can provide guidance on CPR, choking, bleeding, burns, strokes, seizures, poisoning, fractures, snake bites, heatstroke, and more. What's the emergency?";
    }

    // Conversational
    if (['thanks', 'thank you', 'thx'].some(w => query.includes(w))) {
      return "You're welcome! Stay safe. Is there anything else you need help with?";
    }
    if (['bye', 'goodbye'].some(w => query.includes(w))) {
      return "Goodbye! Stay safe and call 1990 if you have a medical emergency.";
    }

    // Search through knowledge base
    for (const key in FIRST_AID_KNOWLEDGE) {
      const entry = FIRST_AID_KNOWLEDGE[key];
      if (entry.keywords.some(keyword => query.includes(keyword))) {
        return entry.response;
      }
    }

    // Default polite response
    return "I'm sorry, I'm still learning about that specific first aid scenario. \n\nFor immediate life-threatening emergencies, please call 1990. \n\nYou can also check our visual guides in the 'Common Emergencies' section for more details.";
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
    backgroundColor: '#1e3a8a',
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
    backgroundColor: '#2563eb',
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
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
});
