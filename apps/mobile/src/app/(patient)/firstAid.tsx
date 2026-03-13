import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Linking, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const FIRST_AID_GUIDES = [
  {
    id: 'cpr',
    title: 'CPR (Adult)',
    icon: 'heart-pulse',
    color: 'bg-red-500',
    steps: [
      'Call emergency services immediately.',
      'Place the heel of your hand on the center of the chest.',
      'Place your other hand on top and interlock your fingers.',
      'Push hard and fast in the center of the chest (100-120 pushes a minute).',
      'Continue until help arrives or the person starts breathing.'
    ]
  },
  {
    id: 'choking',
    title: 'Choking',
    icon: 'weather-windy',
    color: 'bg-orange-500',
    steps: [
      'Ask the person if they are choking. If they cannot speak, call 911.',
      'Give 5 back blows between the shoulder blades with the heel of your hand.',
      'Give 5 abdominal thrusts (Heimlich maneuver) just above the navel.',
      'Alternate between 5 blows and 5 thrusts until the blockage is dislodged.'
    ]
  },
  {
    id: 'bleeding',
    title: 'Severe Bleeding',
    icon: 'water',
    color: 'bg-red-600',
    steps: [
      'Apply direct pressure to the wound using a clean cloth or sterile dressing.',
      'Do not remove the cloth if it becomes soaked; add more layers on top.',
      'If possible, elevate the injured area above the heart.',
      'Call emergency services if the bleeding does not stop after 10 minutes or if it is severe.'
    ]
  },
  {
    id: 'burns',
    title: 'Burns',
    icon: 'fire-extinguisher',
    color: 'bg-yellow-500',
    steps: [
      'Cool the burn under cool (not cold) running water for at least 10 minutes.',
      'Remove tight items like rings or clothing from the burned area before it swells.',
      'Cover the burn loosely with a sterile, non-fluffy dressing or cling film.',
      'Do NOT apply ice, butter, or ointments to the burn.',
      'Call for medical help for severe burns.'
    ]
  },
  {
    id: 'heart_attack',
    title: 'Heart Attack',
    icon: 'heart-broken',
    color: 'bg-rose-500',
    steps: [
      'Call emergency services immediately. Do not ignore the symptoms.',
      'Have the person sit down, rest, and try to keep calm.',
      'Loosen any tight clothing.',
      'If they are prescribed medicine like nitroglycerin, help them take it.',
      'If they are unresponsive and not breathing normally, begin CPR.'
    ]
  }
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
    <ScrollView className="flex-1 bg-gray-50 p-4">
      {/* EMT Contact Button */}
      <View className="mb-6">
        <TouchableOpacity 
          className="bg-red-600 flex-row items-center justify-center py-4 rounded-xl shadow-sm"
          onPress={handleContactEMT}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="ambulance" size={24} color="white" />
          <Text className="text-white font-bold text-lg ml-2">Contact EMT Now</Text>
        </TouchableOpacity>
        <Text className="text-center text-gray-500 text-sm mt-2">
          If this is a life-threatening emergency, call immediately.
        </Text>
      </View>

      <View className="mb-4">
        <Text className="text-2xl font-bold text-gray-800">First Aid Guide</Text>
        <Text className="text-gray-600 mt-1 mb-4">
          Step-by-step instructions for common emergencies.
        </Text>
      </View>

      <View className="pb-8">
        {FIRST_AID_GUIDES.map((guide) => {
          const isExpanded = expandedId === guide.id;
          return (
            <View key={guide.id} className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden border border-gray-100">
              <TouchableOpacity 
                className="flex-row items-center p-4"
                onPress={() => toggleExpand(guide.id)}
                activeOpacity={0.7}
              >
                <View className={`${guide.color} w-10 h-10 rounded-full items-center justify-center mr-3`}>
                  <MaterialCommunityIcons name={guide.icon as any} size={20} color="white" />
                </View>
                <Text className="flex-1 text-lg font-semibold text-gray-800">{guide.title}</Text>
                <MaterialCommunityIcons 
                  name={isExpanded ? "chevron-up" : "chevron-down"} 
                  size={24} 
                  color="#9CA3AF" 
                />
              </TouchableOpacity>
              
              {isExpanded && (
                <View className="px-4 pb-4 pt-0">
                  <View className="h-[1px] bg-gray-100 mb-3" />
                  {guide.steps.map((step, index) => (
                    <View key={index} className="flex-row mb-3">
                      <View className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-3 mt-0.5">
                        <Text className="text-blue-700 text-xs font-bold">{index + 1}</Text>
                      </View>
                      <Text className="flex-1 text-gray-700 leading-6">{step}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}