/**
 * firstAid.tsx
 *
 * A premium, clean First Aid Guide screen for AmbuLink using Tailwind CSS.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import FirstAidChatBot from '@/features/patient/components/FirstAidChatBot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type Guide = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  accent: string;
  indicator: string;
  steps: string[];
  tutorialUrl: string;
};

const FIRST_AID_GUIDES: Guide[] = [
  {
    id: 'cpr',
    title: 'CPR (Adult)',
    subtitle: 'Cardiac arrest response',
    icon: 'heart-pulse',
    accent: '#ef4444',
    indicator: 'Critical',
    steps: [
      'Call emergency services immediately.',
      'Place hand heel on the center of the chest.',
      'Push hard and fast (100–120 bpm).',
      'Allow full chest recoil between pushes.',
      'Use an AED immediately if one is available.',
      'Continue compressions until professionals arrive.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=cosVBV96E2g',
  },
  {
    id: 'choking',
    title: 'Choking',
    subtitle: 'Airway obstruction',
    icon: 'weather-windy',
    accent: '#f97316',
    indicator: 'Urgent',
    steps: [
      'Confirm the person cannot breathe or speak.',
      'Give 5 firm back blows between shoulder blades.',
      'Give 5 abdominal thrusts (Heimlich maneuver).',
      'Repeat the cycle until the object is forced out.',
      'If they become unconscious, begin CPR.',
      'Stay with them until medical help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=7CgtIgSyAiU',
  },
  {
    id: 'heart_attack',
    title: 'Heart Attack',
    subtitle: 'Chest pain & discomfort',
    icon: 'heart-flash',
    accent: '#e11d48',
    indicator: 'Critical',
    steps: [
      'Call emergency services immediately.',
      'Have the person sit down and stay calm.',
      'Loosen any tight clothing around the neck/waist.',
      'Give 300mg Aspirin to chew (if not allergic).',
      'Begin CPR if they become unconscious.',
      'Monitor them closely until help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=gD78rTF0_7Q',
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    subtitle: 'Hemorrhage control',
    icon: 'water',
    accent: '#dc2626',
    indicator: 'Urgent',
    steps: [
      'Apply direct pressure with a clean cloth.',
      'Do not remove blood-soaked layers; add more.',
      'Elevate the wound above heart level.',
      'Apply a tourniquet if bleeding is life-threatening.',
      'Keep the person warm and treat for shock.',
      'Monitor until emergency responders take over.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=0VJ18H6VKC0',
  },
  {
    id: 'stroke',
    title: 'Stroke (F.A.S.T.)',
    subtitle: 'Brain emergency detection',
    icon: 'brain',
    accent: '#8b5cf6',
    indicator: 'Critical',
    steps: [
      'Face: Ask for a smile. Does one side droop?',
      'Arms: Raise both arms. Does one drift down?',
      'Speech: Repeat a simple phrase. Is it slurred?',
      'Time: If any signs are present, call 1990 now.',
      'Note the exact time when symptoms first began.',
      'Keep them calm and seated until help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=9L9I_9m2M7s',
  },
  {
    id: 'allergic',
    title: 'Allergic Reaction',
    subtitle: 'Anaphylaxis treatment',
    icon: 'flower-pollen',
    accent: '#db2777',
    indicator: 'Critical',
    steps: [
      'Call emergency services immediately.',
      'Identify the trigger (food, sting, etc.).',
      'Help them use their adrenaline auto-injector.',
      'Have them sit up if they have breathing trouble.',
      'Manage shock by laying them flat with legs raised.',
      'Monitor for unconsciousness until help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=N6O3f6F2D6Q',
  },
  {
    id: 'burns',
    title: 'Burns',
    subtitle: 'Thermal injury treatment',
    icon: 'fire-extinguisher',
    accent: '#d97706',
    indicator: 'Medical',
    steps: [
      'Cool under running water for 10-20 mins.',
      'Remove jewelry or tight items before swelling.',
      'Cover with sterile film or very loose dressing.',
      'Protect the area from further heat or friction.',
      'Do NOT use ice, butter, or ointments.',
      'Wait with the casualty until help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=WX_mCORhMog',
  },
  {
    id: 'poisoning',
    title: 'Poisoning',
    subtitle: 'Toxic substance intake',
    icon: 'skull-crossbones',
    accent: '#4a044e',
    indicator: 'Critical',
    steps: [
      'Identify the substance (swallowed or inhaled).',
      'Call emergency services immediately.',
      'Do NOT induce vomiting unless instructed.',
      'If on skin, flush with water for 15+ minutes.',
      'If unconscious, place in the recovery position.',
      'Stay with them until professional help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=cZpE5X6gZ6M',
  },
  {
    id: 'heatstroke',
    title: 'Heat Stroke',
    subtitle: 'Severe hyperthermia',
    icon: 'thermometer-alert',
    accent: '#ea580c',
    indicator: 'Critical',
    steps: [
      'Move the person to a cool, shaded area.',
      'Apply wet cloths or ice packs to neck/armpits.',
      'Remove as much outer clothing as possible.',
      'If alert, give small sips of cool water.',
      'Fan the person to lower their body temperature.',
      'Remain with them until medical help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=W0S7FvInmxs',
  },
  {
    id: 'snakebite',
    title: 'Snake Bite',
    subtitle: 'Venomous bite response',
    icon: 'snake',
    accent: '#10b981',
    indicator: 'Critical',
    steps: [
      'Keep the person calm and as still as possible.',
      'Remove restrictive jewelry or clothing nearby.',
      'Keep the bite area below the level of the heart.',
      'Apply a pressure immobilization bandage if available.',
      'Do NOT cut the wound or try to suck out venom.',
      'Stay with the person until medical help arrives.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=H7_4jZpZ-qg',
  },
];

export default function FirstAid() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isChatVisible, setIsChatVisible] = useState(false);
  const insets = useSafeAreaInsets();

  React.useEffect(() => {
    StatusBar.setBarStyle('dark-content');
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('#ffffff');
      StatusBar.setTranslucent(false);
    }
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} hidden={false} />

      {/* Header */}
      <View 
        className="px-6 pb-5 bg-white" 
        style={{ paddingTop: Platform.OS === 'android' ? 45 : insets.top + 40 }}
      >
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-2xl font-black text-slate-900 tracking-tighter" style={{ fontFamily: Platform.OS === 'ios' ? 'Avenir Next' : undefined }}>
              First Aid Guide
            </Text>
            <Text className="text-sm text-slate-500 font-medium mt-0.5">
              Simple steps for any emergency
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-6"
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* AI Assistant Banner (Black Theme) */}
        <TouchableOpacity
          onPress={() => setIsChatVisible(true)}
          activeOpacity={0.9}
          className="rounded-3xl overflow-hidden mb-6 mt-0 shadow-xl shadow-black/10"
          style={{
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.1,
            shadowRadius: 10,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={['#000000', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center">
                <MaterialCommunityIcons name="robot" size={24} color="white" />
              </View>
              <View className="ml-4">
                <Text className="text-white text-base font-extrabold">AmbuLink AI Assistant</Text>
                <Text className="text-white/80 text-xs font-semibold mt-0.5">Ask anything for instant help</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="white" className="opacity-70" />
          </LinearGradient>
        </TouchableOpacity>

        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-lg font-black text-slate-800">Essential Guides</Text>
          <View className="bg-slate-100 px-3 py-1 rounded-xl">
            <Text className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
              {FIRST_AID_GUIDES.length} Items
            </Text>
          </View>
        </View>

        {/* Guide Cards */}
        {FIRST_AID_GUIDES.map((guide) => {
          const isExpanded = expandedId === guide.id;
          return (
            <View
              key={guide.id}
              className={`bg-white rounded-[30px] mb-4 border border-slate-50 overflow-hidden ${
                isExpanded ? 'border-blue-500 border-[1.5px]' : ''
              }`}
              style={{
                shadowColor: isExpanded ? '#3b82f6' : '#000',
                shadowOffset: { width: 0, height: isExpanded ? 10 : 4 },
                shadowOpacity: isExpanded ? 0.15 : 0.05,
                shadowRadius: isExpanded ? 20 : 10,
                elevation: isExpanded ? 10 : 4,
              }}
            >
              <TouchableOpacity
                className="flex-row items-center p-4"
                onPress={() => toggleExpand(guide.id)}
                activeOpacity={0.7}
              >
                <View 
                  className="w-14 h-14 rounded-2xl items-center justify-center border border-black/5"
                  style={{ backgroundColor: guide.accent + '10' }}
                >
                  <MaterialCommunityIcons
                    name={guide.icon as any}
                    size={24}
                    color={guide.accent}
                  />
                </View>

                <View className="flex-1 ml-4">
                  <View className="flex-row items-center">
                    <Text className="text-lg font-black text-slate-800 tracking-tight">{guide.title}</Text>
                    <View 
                      className="ml-2 px-2 py-0.5 rounded-lg"
                      style={{ backgroundColor: guide.accent + '15' }}
                    >
                      <Text 
                        className="text-[10px] font-black uppercase tracking-tight"
                        style={{ color: guide.accent }}
                      >
                        {guide.indicator}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-sm text-slate-500 font-medium mt-0.5">{guide.subtitle}</Text>
                </View>

                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>

              {isExpanded && (
                <View className="px-5 pb-6">
                  {guide.steps.map((step, index) => (
                    <View key={index} className="flex-row mb-3">
                      <View className="w-5 items-center mr-3">
                        <View 
                          className="w-2 h-2 rounded-full mt-2.5" 
                          style={{ backgroundColor: guide.accent }}
                        />
                        {index !== guide.steps.length - 1 && (
                          <View 
                            className="w-[1.5px] flex-1 bg-slate-100 my-1" 
                            style={{ minHeight: 15 }}
                          />
                        )}
                      </View>
                      <Text className="flex-1 text-[15px] text-slate-600 leading-6 py-1 font-medium">{step}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => Linking.openURL(guide.tutorialUrl)}
                    className="flex-row items-center justify-center mt-4 py-3 rounded-2xl bg-slate-50"
                  >
                    <MaterialCommunityIcons name="play-circle" size={18} color="#1e3a8a" />
                    <Text className="text-sm font-black text-blue-900 ml-2">Watch Tutorial</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      <FirstAidChatBot
        visible={isChatVisible}
        onClose={() => setIsChatVisible(false)}
      />
    </View>
  );
}