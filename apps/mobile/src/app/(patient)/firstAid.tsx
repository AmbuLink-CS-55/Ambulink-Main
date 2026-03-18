/**
 * firstAid.tsx
 *
 * A premium, clean First Aid Guide screen for AmbuLink.
 * Features a light, minimalist aesthetic with high-end typography
 * and subtle shadows for a modern, attractive look.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  TextInput,
  Dimensions,
  StyleSheet,
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" translucent={false} hidden={false} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 55 : insets.top + 60 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>First Aid Guide</Text>
            <Text style={styles.headerSubtitle}>Simple steps for any emergency</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Attractive AI Assistant Section ── */}
        <TouchableOpacity
          onPress={() => setIsChatVisible(true)}
          activeOpacity={0.9}
          style={styles.aiBanner}
        >
          <LinearGradient
            colors={['#1e3a8a', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiBannerGradient}
          >
            <View style={styles.aiBannerLeft}>
              <View style={styles.aiIconBadge}>
                <MaterialCommunityIcons name="robot" size={26} color="white" />
              </View>
              <View style={{ marginLeft: 15 }}>
                <Text style={styles.aiBannerTitle}>AmbuLink AI Assistant</Text>
                <Text style={styles.aiBannerSub}>Ask anything for instant help</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="white" style={{ opacity: 0.7 }} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Essential Guides</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{FIRST_AID_GUIDES.length} Items</Text>
          </View>
        </View>

        {/* ── Modern Guide Cards ── */}
        {FIRST_AID_GUIDES.map((guide) => {
          const isExpanded = expandedId === guide.id;
          return (
            <View
              key={guide.id}
              style={[
                styles.guideCard,
                isExpanded && styles.guideCardActive
              ]}
            >
              <TouchableOpacity
                style={styles.guideCardHeader}
                onPress={() => toggleExpand(guide.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.guideIconContainer, { backgroundColor: guide.accent + '10' }]}>
                  <MaterialCommunityIcons
                    name={guide.icon as any}
                    size={26}
                    color={guide.accent}
                  />
                </View>

                <View style={styles.guideTextContainer}>
                  <View style={styles.guideTitleRow}>
                    <Text style={styles.guideTitle}>{guide.title}</Text>
                    <View style={[styles.indicatorBadge, { backgroundColor: guide.accent + '15' }]}>
                      <Text style={[styles.indicatorText, { color: guide.accent }]}>{guide.indicator}</Text>
                    </View>
                  </View>
                  <Text style={styles.guideSubtitle}>{guide.subtitle}</Text>
                </View>

                <MaterialCommunityIcons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.guideCardBody}>
                  {guide.steps.map((step, index) => (
                    <View key={index} style={styles.stepRow}>
                      <View style={styles.stepIndex}>
                        <View style={[styles.stepDot, { backgroundColor: guide.accent }]} />
                        {index !== guide.steps.length - 1 && <View style={styles.stepConnector} />}
                      </View>
                      <Text style={styles.stepText}>{step}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    onPress={() => Linking.openURL(guide.tutorialUrl)}
                    style={styles.videoButton}
                  >
                    <MaterialCommunityIcons name="play-circle" size={18} color="#1e3a8a" />
                    <Text style={styles.videoButtonText}>Watch Tutorial</Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    paddingHorizontal: 25,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 25,
  },
  aiBanner: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 30,
    marginTop: 10,
    elevation: 4,
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  aiBannerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  aiBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconBadge: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '800',
  },
  aiBannerSub: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  badge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '800',
  },
  guideCard: {
    backgroundColor: '#ffffff',
    borderRadius: 30,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    overflow: 'hidden',
  },
  guideCardActive: {
    borderColor: '#3b82f6',
    borderWidth: 1.5,
    shadowColor: '#3b82f6',
    shadowOpacity: 0.1,
    shadowRadius: 25,
    elevation: 10,
  },
  guideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  guideIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  guideTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.3,
  },
  indicatorBadge: {
    marginLeft: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  indicatorText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  guideSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '500',
  },
  guideCardBody: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  stepIndex: {
    width: 20,
    alignItems: 'center',
    marginRight: 12,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 10,
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
    minHeight: 20,
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: '#475569',
    lineHeight: 24,
    paddingVertical: 4,
    fontWeight: '500',
  },
  videoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  videoButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1e3a8a',
    marginLeft: 8,
  },
});