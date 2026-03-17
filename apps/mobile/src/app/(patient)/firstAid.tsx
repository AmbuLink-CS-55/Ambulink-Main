/**
 * firstAid.tsx
 *
 * First Aid Guide screen for the AmbuLink patient app.
 *
 * Features:
 * - Rich hero header with emergency count stats
 * - Accordion-style cards with gradient color banners
 * - Step-by-step instructions with numbered connectors
 * - "Watch Tutorial" button per card that opens a YouTube video
 *
 * Styled with Tailwind CSS (via uniwind).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type Guide = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  iconBg: string;
  accent: string;
  accentLight: string;
  stepDotColor: string;
  steps: string[];
  tutorialUrl: string;
};

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

const FIRST_AID_GUIDES: Guide[] = [
  {
    id: 'cpr',
    title: 'CPR (Adult)',
    subtitle: 'Cardiac arrest response',
    icon: 'heart-pulse',
    iconBg: '#ef4444',
    accent: '#ef4444',
    accentLight: '#fff1f2',
    stepDotColor: '#fca5a5',
    steps: [
      'Call emergency services immediately.',
      'Place the heel of your hand on the center of the chest.',
      'Place your other hand on top and interlock your fingers.',
      'Push hard and fast (100–120 pushes per minute).',
      'Continue until help arrives or the person starts breathing.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=cosVBV96E2g',
  },
  {
    id: 'choking',
    title: 'Choking',
    subtitle: 'Airway obstruction',
    icon: 'weather-windy',
    iconBg: '#f97316',
    accent: '#f97316',
    accentLight: '#fff7ed',
    stepDotColor: '#fdba74',
    steps: [
      'Ask if they are choking. If they cannot speak, act immediately.',
      'Give 5 firm back blows between the shoulder blades.',
      'Give 5 abdominal thrusts (Heimlich maneuver) just above the navel.',
      'Alternate between 5 blows and 5 thrusts until the blockage clears.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=7CgtIgSyAiU',
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    subtitle: 'Hemorrhage control',
    icon: 'water',
    iconBg: '#dc2626',
    accent: '#dc2626',
    accentLight: '#fef2f2',
    stepDotColor: '#f87171',
    steps: [
      'Apply direct pressure using a clean cloth or sterile dressing.',
      'Do not remove the cloth if soaked — add more layers on top.',
      'Elevate the injured area above the heart if possible.',
      "Call emergency services if bleeding doesn't stop in 10 minutes.",
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=0VJ18H6VKC0',
  },
  {
    id: 'burns',
    title: 'Burns',
    subtitle: 'Thermal injury treatment',
    icon: 'fire-extinguisher',
    iconBg: '#d97706',
    accent: '#d97706',
    accentLight: '#fffbeb',
    stepDotColor: '#fcd34d',
    steps: [
      'Cool the burn under cool (not cold) running water for 10+ minutes.',
      'Remove rings or tight items before the area swells.',
      'Cover loosely with a sterile, non-fluffy dressing or cling film.',
      'Do NOT apply ice, butter, or any ointments.',
      'Seek medical help for severe or large burns.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=WX_mCORhMog',
  },
  {
    id: 'heart_attack',
    title: 'Heart Attack',
    subtitle: 'Myocardial infarction',
    icon: 'heart-broken',
    iconBg: '#db2777',
    accent: '#db2777',
    accentLight: '#fdf2f8',
    stepDotColor: '#f9a8d4',
    steps: [
      "Call emergency services immediately — don't wait.",
      'Have the person sit or lie down and stay calm.',
      'Loosen any tight clothing around the neck and chest.',
      'Help them take prescribed medication (e.g. nitroglycerin) if available.',
      'If unresponsive and not breathing, begin CPR immediately.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=RCeNLKOFMgs',
  },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function FirstAid() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };



  const filteredGuides = FIRST_AID_GUIDES.filter((guide) =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View className="flex-1 bg-slate-50">
      {/* ── Fixed Header ── */}
      <View
        style={{
          backgroundColor: '#1e3a8a',
          paddingTop: 60,
          paddingBottom: 20,
          paddingHorizontal: 20,
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
        }}
      >
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text
              style={{
                fontSize: 28,
                fontWeight: '800',
                color: '#ffffff',
                letterSpacing: -0.5,
              }}
            >
              First Aid Guide
            </Text>
          </View>
          <View
            className="w-12 h-12 rounded-2xl items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          >
            <MaterialCommunityIcons name="book-open-variant" size={24} color="#ffffff" />
          </View>
        </View>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 52,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search emergency guides..."
            placeholderTextColor="#64748b"
            style={{
              flex: 1,
              marginLeft: 10,
              color: '#ffffff',
              fontSize: 15,
              fontWeight: '500',
            }}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== '' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 40, paddingTop: 10 }}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Section label ── */}
        <View style={{ paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#94a3b8', letterSpacing: 1, textTransform: 'uppercase' }}>
            Common Emergencies
          </Text>
        </View>

        {/* ── Cards ── */}
        <View className="px-4">
          {filteredGuides.map((guide, idx) => {
            const isExpanded = expandedId === guide.id;

            return (
              <View
                key={guide.id}
                className="mb-4 rounded-3xl overflow-hidden bg-white"
                style={{
                  borderWidth: isExpanded ? 1.5 : 1,
                  borderColor: isExpanded ? guide.accent : '#f1f5f9',
                  shadowColor: guide.iconBg,
                  shadowOpacity: isExpanded ? 0.18 : 0.06,
                  shadowRadius: 16,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: isExpanded ? 6 : 2,
                }}
              >
                {/* ── Colored top stripe ── */}
                <View
                  style={{
                    height: 4,
                    backgroundColor: guide.accent,
                    opacity: isExpanded ? 1 : 0.4,
                  }}
                />

                {/* ── Card header ── */}
                <TouchableOpacity
                  className="flex-row items-center px-4 py-4"
                  style={{ minHeight: 84 }}
                  onPress={() => toggleExpand(guide.id)}
                  activeOpacity={0.72}
                >
                  {/* Index number */}
                  <Text
                    className="text-[11px] font-black mr-3"
                    style={{ color: isExpanded ? guide.accent : '#cbd5e1', width: 18 }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </Text>

                  {/* Icon with soft glow bg */}
                  <View
                    className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                    style={{
                      backgroundColor: isExpanded ? guide.iconBg : guide.accentLight,
                      shadowColor: guide.iconBg,
                      shadowOpacity: isExpanded ? 0.4 : 0,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: isExpanded ? 5 : 0,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={guide.icon as any}
                      size={26}
                      color={isExpanded ? 'white' : guide.accent}
                    />
                  </View>

                  {/* Title & subtitle */}
                  <View className="flex-1">
                    <Text
                      className="text-[17px] font-bold"
                      style={{ color: isExpanded ? '#0f172a' : '#1e293b' }}
                    >
                      {guide.title}
                    </Text>
                    <Text className="text-[12px] text-slate-400 mt-0.5 font-medium">
                      {isExpanded
                        ? `${guide.steps.length} steps`
                        : guide.subtitle}
                    </Text>
                  </View>

                  {/* Chevron */}
                  <View
                    className="w-9 h-9 rounded-full items-center justify-center"
                    style={{
                      backgroundColor: isExpanded ? guide.accentLight : '#f8fafc',
                    }}
                  >
                    <MaterialCommunityIcons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={22}
                      color={isExpanded ? guide.accent : '#94a3b8'}
                    />
                  </View>
                </TouchableOpacity>

                {/* ── Expanded content ── */}
                {isExpanded && (
                  <View className="px-5 pb-6">
                    {/* Divider */}
                    <View
                      className="h-px mb-5"
                      style={{ backgroundColor: guide.accentLight }}
                    />

                    {/* Steps */}
                    {guide.steps.map((step, index) => {
                      const isLast = index === guide.steps.length - 1;
                      return (
                        <View key={index} className="flex-row">
                          {/* Left: number + line */}
                          <View className="items-center mr-4" style={{ width: 30 }}>
                            <View
                              className="w-[30px] h-[30px] rounded-full items-center justify-center"
                              style={{
                                backgroundColor: guide.accent,
                                shadowColor: guide.accent,
                                shadowOpacity: 0.35,
                                shadowRadius: 6,
                                shadowOffset: { width: 0, height: 2 },
                                elevation: 3,
                              }}
                            >
                              <Text className="text-white text-[12px] font-black">
                                {index + 1}
                              </Text>
                            </View>
                            {!isLast && (
                              <View
                                className="w-px flex-1 my-1"
                                style={{
                                  backgroundColor: guide.stepDotColor,
                                  opacity: 0.6,
                                  minHeight: 20,
                                }}
                              />
                            )}
                          </View>

                          {/* Step text */}
                          <Text className="flex-1 text-[15px] text-slate-600 leading-relaxed pt-1 pb-5 pr-2">
                            {step}
                          </Text>
                        </View>
                      );
                    })}

                    {/* Watch Tutorial button */}
                    <TouchableOpacity
                      className="flex-row items-center self-start mt-1 ml-[46px] rounded-xl border px-4 py-2.5"
                      style={{
                        gap: 8,
                        borderColor: guide.accent + '40',
                        backgroundColor: guide.accentLight,
                      }}
                      onPress={() => Linking.openURL(guide.tutorialUrl)}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="play-circle" size={18} color={guide.accent} />
                      <Text className="text-[14px] font-bold" style={{ color: guide.accent }}>
                        Watch Tutorial
                      </Text>
                      <MaterialCommunityIcons
                        name="open-in-new"
                        size={13}
                        color={guide.accent}
                        style={{ opacity: 0.55 }}
                      />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>


    </View>
  );
}