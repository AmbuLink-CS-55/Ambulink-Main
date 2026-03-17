/**
 * firstAid.tsx
 *
 * A premium, highly attractive First Aid Guide screen.
 * Blends minimalist "Clean" design with "Rich" vibrant aesthetics.
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
    accent: '#ff4d4d',
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
    accent: '#fbbf24',
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
    accent: '#ef4444',
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
    accent: '#a855f7',
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
    accent: '#f59e0b',
    indicator: 'Supportive',
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
      <StatusBar barStyle="light-content" />
      
      {/* ── Rich Vibrant Header ── */}
      <LinearGradient
        colors={['#1e3a8a', '#2563eb', '#3b82f6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerLabel}>AMBULINK CARE</Text>
            <Text style={styles.headerTitle}>First Aid Guide</Text>
          </View>
        </View>

        {/* Search Bar with Glass Effect */}
        <View style={styles.searchWrapper}>
          <MaterialCommunityIcons name="magnify" size={20} color="#cbd5e1" />
          <TextInput
            placeholder="Search instructions..."
            placeholderTextColor="#94a3b8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={{ paddingBottom: 120, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Premium AI Banner ── */}
        <TouchableOpacity
          onPress={() => setIsChatVisible(true)}
          activeOpacity={0.9}
          style={styles.aiBanner}
        >
          <LinearGradient
            colors={['#1e3a8a', '#1e40af']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.aiBannerGradient}
          >
            <View style={styles.aiBannerLeft}>
               <View style={styles.aiIconBadge}>
                 <MaterialCommunityIcons name="robot-happy" size={28} color="white" />
               </View>
               <View style={{ marginLeft: 16 }}>
                 <Text style={styles.aiBannerTitle}>DeepMind AI Assistant</Text>
                 <Text style={styles.aiBannerSub}>Ready to guide you step-by-step</Text>
               </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="white" style={{ opacity: 0.6 }} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Guides</Text>
          <View style={styles.counterBadge}>
            <Text style={styles.counterText}>{filteredGuides.length}</Text>
          </View>
        </View>

        {/* ── Attractive Guide Cards ── */}
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
                activeOpacity={0.8}
              >
                <View style={[styles.guideIconContainer, { backgroundColor: guide.accent + '15' }]}>
                   <LinearGradient
                     colors={isExpanded ? [guide.accent, guide.accent] : ['transparent', 'transparent']}
                     style={styles.guideIconGradient}
                   >
                     <MaterialCommunityIcons 
                       name={guide.icon as any} 
                       size={28} 
                       color={isExpanded ? 'white' : guide.accent} 
                     />
                   </LinearGradient>
                </View>
                
                <View style={styles.guideTextContainer}>
                  <View style={styles.guideTitleRow}>
                    <Text style={styles.guideTitle}>{guide.title}</Text>
                    <View style={[styles.indicatorBadge, { backgroundColor: guide.accent + '20' }]}>
                      <Text style={[styles.indicatorText, { color: guide.accent }]}>{guide.indicator}</Text>
                    </View>
                  </View>
                  <Text style={styles.guideSubtitle}>{guide.subtitle}</Text>
                </View>
                
                <MaterialCommunityIcons 
                  name={isExpanded ? 'close' : 'chevron-down'} 
                  size={20} 
                  color={isExpanded ? guide.accent : '#94a3b8'} 
                />
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.guideCardBody}>
                  <View style={styles.divider} />
                  {guide.steps.map((step, index) => (
                    <View key={index} style={styles.stepContainer}>
                      <View style={styles.stepIndex}>
                        <View style={[styles.stepCircle, { backgroundColor: guide.accent }]}>
                          <Text style={styles.stepCircleText}>{index + 1}</Text>
                        </View>
                        {index !== guide.steps.length - 1 && (
                          <View style={styles.stepConnector} />
                        )}
                      </View>
                      <Text style={styles.stepTextContent}>{step}</Text>
                    </View>
                  ))}
                  
                  <TouchableOpacity
                    onPress={() => Linking.openURL(guide.tutorialUrl)}
                    style={[styles.tutorialButton, { borderColor: guide.accent + '40' }]}
                  >
                    <MaterialCommunityIcons name="play-circle" size={20} color={guide.accent} />
                    <Text style={[styles.tutorialButtonText, { color: guide.accent }]}>Watch Video Tutorial</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          );
        })}

        {/* ── Footer Tip ── */}
        <View style={styles.footerTip}>
           <View style={styles.footerTipIcon}>
             <MaterialCommunityIcons name="lightbulb-on" size={24} color="#f59e0b" />
           </View>
           <View style={{ flex: 1, marginLeft: 15 }}>
             <Text style={styles.footerTipTitle}>Safety Protocol</Text>
             <Text style={styles.footerTipText}>
               In any life-threatening situation, your first action must always be calling 1990.
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
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 30,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    color: 'white',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  aiHeaderButton: {
    position: 'relative',
  },
  aiHeaderIcon: {
    width: 52,
    height: 52,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  onlineDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#22c55e',
    borderWidth: 3,
    borderColor: '#3b82f6',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  aiBanner: {
    marginTop: -20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#1e3a8a',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
    marginBottom: 30,
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
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  aiBannerTitle: {
    color: 'white',
    fontSize: 17,
    fontWeight: '900',
  },
  aiBannerSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1e293b',
  },
  counterBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  counterText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748b',
  },
  guideCard: {
    backgroundColor: 'white',
    borderRadius: 28,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  guideCardActive: {
    borderColor: '#e2e8f0',
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  guideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  guideIconContainer: {
    width: 58,
    height: 58,
    borderRadius: 20,
    overflow: 'hidden',
  },
  guideIconGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextContainer: {
    flex: 1,
    marginLeft: 16,
  },
  guideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guideTitle: {
    fontSize: 18,
    fontWeight: '800',
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
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  guideCardBody: {
    paddingHorizontal: 22,
    paddingBottom: 22,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginBottom: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  stepIndex: {
    width: 24,
    alignItems: 'center',
    marginRight: 15,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  stepCircleText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '900',
  },
  stepConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 4,
    minHeight: 25,
  },
  stepTextContent: {
    flex: 1,
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
    fontWeight: '500',
  },
  tutorialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  tutorialButtonText: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 8,
  },
  footerTip: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 20,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#fef3c7',
  },
  footerTipIcon: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#f59e0b',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  footerTipTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#92400e',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  footerTipText: {
    fontSize: 13,
    color: '#b45309',
    lineHeight: 18,
    fontWeight: '600',
    marginTop: 2,
  },
});