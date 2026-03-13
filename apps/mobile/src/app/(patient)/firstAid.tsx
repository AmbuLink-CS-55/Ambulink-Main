/**
 * firstAid.tsx
 *
 * First Aid Guide screen for the AmbuLink patient app.
 *
 * Features:
 * - Accordion-style cards for 5 common medical emergencies
 * - Step-by-step instructions with numbered connectors
 * - "Watch Tutorial" button per card that opens a YouTube video
 * - Sticky "Contact EMT Now" button that dials 911
 *
 * Styled with Tailwind CSS (via uniwind).
 */

import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

/** Represents a single first aid scenario displayed on this screen. */
type Guide = {
  id: string;
  title: string;
  /** MaterialCommunityIcons icon name */
  icon: string;
  /** Solid background color for the icon box */
  iconBg: string;
  /** Primary accent color used for borders, step numbers, and tutorial button */
  accent: string;
  /** Light tint of accent used for backgrounds and dividers */
  accentLight: string;
  /** Color of the connector dots between steps */
  stepDotColor: string;
  /** Ordered list of first aid steps */
  steps: string[];
  /** YouTube tutorial URL opened when user taps "Watch Tutorial" */
  tutorialUrl: string;
};

// ─────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────

/** Static list of first aid guides shown on this screen. */
const FIRST_AID_GUIDES: Guide[] = [
  {
    id: 'cpr',
    title: 'CPR (Adult)',
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
    icon: 'weather-windy',
    iconBg: '#f97316',
    accent: '#f97316',
    accentLight: '#fff7ed',
    stepDotColor: '#fdba74',
    steps: [
      'Ask the person if they are choking. If they cannot speak, call 911.',
      'Give 5 firm back blows between the shoulder blades.',
      'Give 5 abdominal thrusts (Heimlich maneuver) just above the navel.',
      'Alternate between 5 blows and 5 thrusts until the blockage clears.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=7CgtIgSyAiU',
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    icon: 'water',
    iconBg: '#dc2626',
    accent: '#dc2626',
    accentLight: '#fef2f2',
    stepDotColor: '#f87171',
    steps: [
      'Apply direct pressure using a clean cloth or sterile dressing.',
      'Do not remove the cloth if soaked — add more layers on top.',
      'Elevate the injured area above the heart if possible.',
      "Call emergency services if bleeding is severe or doesn't stop in 10 minutes.",
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=0VJ18H6VKC0',
  },
  {
    id: 'burns',
    title: 'Burns',
    icon: 'fire-extinguisher',
    iconBg: '#d97706',
    accent: '#d97706',
    accentLight: '#fffbeb',
    stepDotColor: '#fcd34d',
    steps: [
      'Cool the burn under cool (not cold) running water for 10+ minutes.',
      'Remove tight items like rings before the area swells.',
      'Cover loosely with a sterile, non-fluffy dressing or cling film.',
      'Do NOT apply ice, butter, or any ointments.',
      'Seek medical help for severe or large burns.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=WX_mCORhMog',
  },
  {
    id: 'heart_attack',
    title: 'Heart Attack',
    icon: 'heart-broken',
    iconBg: '#db2777',
    accent: '#db2777',
    accentLight: '#fdf2f8',
    stepDotColor: '#f9a8d4',
    steps: [
      "Call emergency services immediately — don't wait.",
      'Have the person sit, rest, and stay calm.',
      'Loosen any tight clothing around the neck and chest.',
      'Help them take their prescribed medication if available.',
      'If unresponsive and not breathing, begin CPR.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=RCeNLKOFMgs',
  },
];

// ─────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────

export default function FirstAid() {
  /** Tracks which guide card is currently expanded. null = all collapsed. */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /**
   * Toggles a guide card open or closed.
   * Tapping an already-open card will collapse it.
   */
  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  /**
   * Dials 911 using the device's native phone dialer.
   * Uses `tel:` on Android and `telprompt:` on iOS (shows a confirmation prompt).
   */
  const handleContactEMT = () => {
    const phoneNumber = '911';
    if (Platform.OS === 'android') {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Linking.openURL(`telprompt:${phoneNumber}`);
    }
  };

  return (
    <View className="flex-1 bg-slate-50">
      {/* ── Scrollable content area ── */}
      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 130 }} // extra space above sticky footer
        showsVerticalScrollIndicator={false}
      >
        {/* ── Page title ── */}
        <View className="mt-12 mb-5 px-1">
          <Text className="text-[26px] font-extrabold text-slate-900 tracking-tight">
            First Aid Guide
          </Text>
        </View>

        {/* ── List of first aid guide cards ── */}
        {FIRST_AID_GUIDES.map((guide) => {
          const isExpanded = expandedId === guide.id;

          return (
            <View
              key={guide.id}
              className="bg-white rounded-3xl mb-4 overflow-hidden"
              style={{
                // Thicker colored border when expanded, subtle border when collapsed
                borderWidth: isExpanded ? 1.5 : 1,
                borderColor: isExpanded ? guide.accent : '#f1f5f9',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 2 },
                elevation: 2,
              }}
            >
              {/* ── Card header (always visible — tappable to expand/collapse) ── */}
              <TouchableOpacity
                className="flex-row items-center pr-4 py-4"
                style={{ paddingLeft: isExpanded ? 20 : 16, minHeight: 80 }}
                onPress={() => toggleExpand(guide.id)}
                activeOpacity={0.75}
              >
                {/* Colored left accent bar shown only when expanded */}
                {isExpanded && (
                  <View
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-l-3xl"
                    style={{ backgroundColor: guide.accent }}
                  />
                )}

                {/* Category icon with colored background and shadow */}
                <View
                  className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                  style={{
                    backgroundColor: guide.iconBg,
                    shadowColor: guide.iconBg,
                    shadowOpacity: 0.35,
                    shadowRadius: 8,
                    shadowOffset: { width: 0, height: 4 },
                    elevation: 4,
                  }}
                >
                  <MaterialCommunityIcons name={guide.icon as any} size={26} color="white" />
                </View>

                {/* Guide title + step count (step count hidden when expanded) */}
                <View className="flex-1 justify-center">
                  <Text className="text-[17px] font-bold text-slate-800">{guide.title}</Text>
                  {!isExpanded && (
                    <Text className="text-[12px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                      {guide.steps.length} steps
                    </Text>
                  )}
                </View>

                {/* Chevron icon — flips direction when card is expanded */}
                <View
                  className="w-9 h-9 rounded-full items-center justify-center"
                  style={{ backgroundColor: isExpanded ? guide.accentLight : '#f8fafc' }}
                >
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={22}
                    color={isExpanded ? guide.accent : '#94a3b8'}
                  />
                </View>
              </TouchableOpacity>

              {/* ── Expanded section: step-by-step instructions + tutorial button ── */}
              {isExpanded && (
                <View className="px-5 pb-5">
                  {/* Thin divider line to separate header from steps */}
                  <View
                    className="h-[2px] rounded-full mb-4 ml-[70px]"
                    style={{ backgroundColor: guide.accentLight }}
                  />

                  {/* Steps list with numbered circles and connecting lines */}
                  {guide.steps.map((step, index) => {
                    const isLast = index === guide.steps.length - 1;
                    return (
                      <View key={index} className="flex-row">
                        {/* Left column: step number circle + vertical connector line */}
                        <View className="items-center mr-4 w-[30px]">
                          {/* Numbered circle */}
                          <View
                            className="w-[30px] h-[30px] rounded-full items-center justify-center"
                            style={{
                              backgroundColor: guide.accentLight,
                              borderWidth: 1.5,
                              borderColor: guide.stepDotColor,
                            }}
                          >
                            <Text
                              className="text-[13px] font-bold"
                              style={{ color: guide.accent }}
                            >
                              {index + 1}
                            </Text>
                          </View>

                          {/* Vertical connector line between steps (hidden after last step) */}
                          {!isLast && (
                            <View
                              className="w-[2px] flex-1 rounded-full my-1 opacity-50"
                              style={{ backgroundColor: guide.stepDotColor, minHeight: 18 }}
                            />
                          )}
                        </View>

                        {/* Right column: step description text */}
                        <Text className="flex-1 text-[15px] text-slate-600 leading-relaxed pt-1 pb-5 pr-1">
                          {step}
                        </Text>
                      </View>
                    );
                  })}

                  {/* "Watch Tutorial" button — opens YouTube video for this emergency */}
                  <TouchableOpacity
                    className="flex-row items-center self-start ml-[44px] mt-1 px-4 py-2.5 rounded-xl bg-white border border-slate-200"
                    style={{
                      gap: 8,
                      shadowColor: '#000',
                      shadowOpacity: 0.04,
                      shadowRadius: 4,
                      shadowOffset: { width: 0, height: 2 },
                      elevation: 2,
                    }}
                    onPress={() => Linking.openURL(guide.tutorialUrl)}
                    activeOpacity={0.8}
                  >
                    {/* Play icon with accent-tinted background */}
                    <View
                      className="w-7 h-7 rounded-full items-center justify-center"
                      style={{ backgroundColor: guide.accentLight }}
                    >
                      <MaterialCommunityIcons name="play-circle" size={18} color={guide.accent} />
                    </View>

                    <Text className="text-[14px] font-bold" style={{ color: guide.accent }}>
                      Watch Tutorial
                    </Text>

                    {/* External link indicator */}
                    <MaterialCommunityIcons
                      name="open-in-new"
                      size={14}
                      color={guide.accent}
                      style={{ opacity: 0.6 }}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Sticky footer: Contact EMT button ── */}
      {/* Always visible at the bottom so users can reach emergency services quickly */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 pt-3 pb-8">
        <TouchableOpacity
          className="flex-row items-center justify-between bg-red-500 px-5 py-4 rounded-[20px]"
          style={{
            shadowColor: '#ef4444',
            shadowOpacity: 0.4,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}
          onPress={handleContactEMT}
          activeOpacity={0.85}
        >
          {/* White phone icon circle */}
          <View className="w-9 h-9 rounded-full bg-white items-center justify-center">
            <MaterialCommunityIcons name="phone-in-talk" size={20} color="#ef4444" />
          </View>

          {/* Button label */}
          <Text className="flex-1 text-center text-white text-[17px] font-extrabold tracking-wide">
            Contact EMT Now
          </Text>

          {/* Right chevron arrow */}
          <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.55)" />
        </TouchableOpacity>
      </View>
    </View>
  );
}