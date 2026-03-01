import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="medical"
        options={{
          title: "Medical",
          tabBarIcon: ({ color, size }) => <Ionicons name="medical" color={color} size={size} />,
          tabBarLabel: "Medical",
          tabBarAccessibilityLabel: "Access medical tools",
        }}
      />
      <Tabs.Screen
        name="navigation"
        options={{
          title: "Navigation",
          tabBarIcon: ({ color, size }) => <Ionicons name="navigate" color={color} size={size} />,
          tabBarLabel: "Navigation",
          tabBarAccessibilityLabel: "Navigate routes",
        }}
      />
      <Tabs.Screen
        name="communication"
        options={{
          title: "Communication",
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubble" color={color} size={size} />,
          tabBarLabel: "Communication",
          tabBarAccessibilityLabel: "Communicate with team",
        }}
      />
    </Tabs>
  );
}
