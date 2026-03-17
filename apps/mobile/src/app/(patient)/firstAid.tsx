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
      'Continue until professional help arrives.',
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
      'Confirm the person is choking and cannot breathe.',
      'Give 5 firm back blows between shoulder blades.',
      'Give 5 abdominal thrusts (Heimlich maneuver).',
      'Repeat until the object is forced out.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=7CgtIgSyAiU',
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
      'Seek emergency help if it doesn\'t stop.',
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
      'Face: Ask them to smile. Does one side droop?',
      'Arms: Can they raise both arms? Does one drift?',
      'Speech: Is it slurred or strange?',
      'Time: If any signs are present, call 1990 now.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=9L9I_9m2M7s',
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
      'Remove tight items before swelling starts.',
      'Cover with sterile film or loose dressing.',
      'Do NOT use ice, butter, or ointments.',
    ],
    tutorialUrl: 'https://www.youtube.com/watch?v=WX_mCORhMog',
  },
];

export default function FirstAid() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isChatVisible, setIsChatVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filteredGuides = FIRST_AID_GUIDES.filter((guide) =>
    guide.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    guide.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* ── Clean Minimalist Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerTitle}>First Aid Guide</Text>
            <Text style={styles.headerSubtitle}>Simple steps for any emergency</Text>
          </View>
        </View>

        {/* Minimal Search Bar */}
        <View style={styles.searchWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
          <TextInput
            placeholder="Search instructions..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 60, paddingTop: 10 }}
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
            <Text style={styles.badgeText}>{filteredGuides.length} Items</Text>
          </View>
        </View>

        {/* ── Modern Guide Cards ── */}
        {filteredGuides.map((guide) => {
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

        {/* ── Footer Tip ── */}
        <View style={styles.tipCard}>
           <MaterialCommunityIcons name="lightbulb-on" size={24} color="#f59e0b" />
           <View style={{ flex: 1, marginLeft: 15 }}>
             <Text style={styles.tipTitle}>Quick Reminder</Text>
             <Text style={styles.tipText}>
               Safety first! Check your surroundings before approaching any casualty.
             </Text>
           </View>
        </View>
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
    paddingBottom: 25,
    backgroundColor: '#ffffff',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 52,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '600',
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
    borderRadius: 24,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  guideCardActive: {
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 15,
    elevation: 2,
  },
  guideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  guideIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
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
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  indicatorBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indicatorText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  guideSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 1,
  },
  guideCardBody: {
    paddingHorizontal: 20,
    paddingBottom: 22,
  },
  stepRow: {
    flexDirection: 'row',
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
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
    paddingVertical: 6,
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
  tipCard: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  tipTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  tipText: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 2,
  },
});