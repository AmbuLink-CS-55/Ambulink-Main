import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type Guide = {
  id: string;
  title: string;
  icon: string;
  iconBg: string;
  accent: string;
  accentLight: string;
  stepDot: string;
  steps: string[];
};

const FIRST_AID_GUIDES: Guide[] = [
  {
    id: 'cpr',
    title: 'CPR (Adult)',
    icon: 'heart-pulse',
    iconBg: '#ef4444',
    accent: '#ef4444',
    accentLight: '#fff1f2',
    stepDot: '#fca5a5',
    steps: [
      'Call emergency services immediately.',
      'Place the heel of your hand on the center of the chest.',
      'Place your other hand on top and interlock your fingers.',
      'Push hard and fast (100–120 pushes per minute).',
      'Continue until help arrives or the person starts breathing.',
    ],
  },
  {
    id: 'choking',
    title: 'Choking',
    icon: 'weather-windy',
    iconBg: '#f97316',
    accent: '#f97316',
    accentLight: '#fff7ed',
    stepDot: '#fdba74',
    steps: [
      'Ask the person if they are choking. If they cannot speak, call 911.',
      'Give 5 firm back blows between the shoulder blades.',
      'Give 5 abdominal thrusts (Heimlich maneuver) just above the navel.',
      'Alternate between 5 blows and 5 thrusts until the blockage clears.',
    ],
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    icon: 'water',
    iconBg: '#dc2626',
    accent: '#dc2626',
    accentLight: '#fef2f2',
    stepDot: '#f87171',
    steps: [
      'Apply direct pressure using a clean cloth or sterile dressing.',
      'Do not remove the cloth if soaked — add more layers on top.',
      'Elevate the injured area above the heart if possible.',
      'Call emergency services if bleeding is severe or doesn\'t stop in 10 minutes.',
    ],
  },
  {
    id: 'burns',
    title: 'Burns',
    icon: 'fire-extinguisher',
    iconBg: '#d97706',
    accent: '#d97706',
    accentLight: '#fffbeb',
    stepDot: '#fcd34d',
    steps: [
      'Cool the burn under cool (not cold) running water for 10+ minutes.',
      'Remove tight items like rings before the area swells.',
      'Cover loosely with a sterile, non-fluffy dressing or cling film.',
      'Do NOT apply ice, butter, or any ointments.',
      'Seek medical help for severe or large burns.',
    ],
  },
  {
    id: 'heart_attack',
    title: 'Heart Attack',
    icon: 'heart-broken',
    iconBg: '#db2777',
    accent: '#db2777',
    accentLight: '#fdf2f8',
    stepDot: '#f9a8d4',
    steps: [
      'Call emergency services immediately — don\'t wait.',
      'Have the person sit, rest, and stay calm.',
      'Loosen any tight clothing around the neck and chest.',
      'Help them take their prescribed medication if available.',
      'If unresponsive and not breathing, begin CPR.',
    ],
  },
];

export default function FirstAid() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleContactEMT = () => {
    const phoneNumber = '911';
    if (Platform.OS === 'android') {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Linking.openURL(`telprompt:${phoneNumber}`);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Title ── */}
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>First Aid Guide</Text>
        </View>

        {/* ── Cards ── */}
        {FIRST_AID_GUIDES.map((guide) => {
          const isExpanded = expandedId === guide.id;
          return (
            <View
              key={guide.id}
              style={[
                styles.card,
                isExpanded && { borderColor: guide.accent, borderWidth: 1.5 },
              ]}
            >
              {/* Card Header (always visible) */}
              <TouchableOpacity
                style={styles.cardHeader}
                onPress={() => toggleExpand(guide.id)}
                activeOpacity={0.75}
              >
                {/* Left accent bar */}
                {isExpanded && (
                  <View style={[styles.accentBar, { backgroundColor: guide.accent }]} />
                )}

                {/* Icon */}
                <View
                  style={[
                    styles.iconBox,
                    { backgroundColor: guide.iconBg },
                    isExpanded && { shadowColor: guide.iconBg },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={guide.icon as any}
                    size={26}
                    color="white"
                  />
                </View>

                {/* Title */}
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle}>{guide.title}</Text>
                  {!isExpanded && (
                    <Text style={styles.cardSub}>{guide.steps.length} steps</Text>
                  )}
                </View>

                {/* Chevron */}
                <View
                  style={[
                    styles.chevronBox,
                    isExpanded && { backgroundColor: guide.accentLight },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={24}
                    color={isExpanded ? guide.accent : '#94a3b8'}
                  />
                </View>
              </TouchableOpacity>

              {/* Expanded Steps */}
              {isExpanded && (
                <View style={styles.stepsContainer}>
                  {/* Thin divider */}
                  <View style={[styles.stepsDivider, { backgroundColor: guide.accentLight }]} />

                  {guide.steps.map((step, index) => {
                    const isLast = index === guide.steps.length - 1;
                    return (
                      <View key={index} style={styles.stepRow}>
                        {/* Number + connector line */}
                        <View style={styles.stepLeft}>
                          <View
                            style={[
                              styles.stepDotOuter,
                              { backgroundColor: guide.accentLight, borderColor: guide.stepDot },
                            ]}
                          >
                            <Text style={[styles.stepNum, { color: guide.accent }]}>
                              {index + 1}
                            </Text>
                          </View>
                          {!isLast && (
                            <View style={[styles.stepConnector, { backgroundColor: guide.stepDot }]} />
                          )}
                        </View>

                        {/* Step text */}
                        <Text style={styles.stepText}>{step}</Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>

      {/* ── Sticky EMT Button ── */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.emtBtn}
          onPress={handleContactEMT}
          activeOpacity={0.85}
        >
          <View style={styles.emtIconCircle}>
            <MaterialCommunityIcons name="phone-in-talk" size={22} color="#ef4444" />
          </View>
          <Text style={styles.emtBtnText}>Contact EMT Now</Text>
          <MaterialCommunityIcons name="chevron-right" size={22} color="rgba(255,255,255,0.6)" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  scrollContent: {
    paddingBottom: 130,
  },

  /* Hero */
  hero: {
    marginTop: 56,
    marginBottom: 28,
    paddingHorizontal: 4,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 16,
    gap: 6,
  },
  badgeText: {
    color: '#ef4444',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  heroTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: '#0f172a',
    lineHeight: 48,
    letterSpacing: -1,
  },
  heroTitleBlue: {
    color: '#3b82f6',
  },
  statRow: {
    flexDirection: 'row',
    marginTop: 18,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'white',
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },

  /* Section label */
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    paddingHorizontal: 2,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginRight: 10,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },

  /* Card */
  card: {
    backgroundColor: 'white',
    borderRadius: 22,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingRight: 16,
    paddingLeft: 16,
    minHeight: 84,
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 22,
  },
  iconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  cardSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  chevronBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },

  /* Steps */
  stepsContainer: {
    paddingTop: 4,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  stepsDivider: {
    height: 2,
    borderRadius: 2,
    marginBottom: 18,
    marginLeft: 70,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepLeft: {
    alignItems: 'center',
    marginRight: 14,
    width: 30,
  },
  stepDotOuter: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  stepNum: {
    fontSize: 13,
    fontWeight: '800',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    minHeight: 18,
    marginVertical: 4,
    borderRadius: 1,
    opacity: 0.5,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    paddingTop: 4,
    paddingBottom: 18,
  },

  /* Footer */
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  emtBtn: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 20,
    shadowColor: '#ef4444',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  emtIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emtBtnText: {
    flex: 1,
    textAlign: 'center',
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});