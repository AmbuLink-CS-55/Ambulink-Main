import { Tabs } from "expo-router";
import Ionicons from "@expo/vector-icons/build/Ionicons";

export default function EmtTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        lazy: true,
        freezeOnBlur: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: "#111827",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "EMT",
          tabBarAccessibilityLabel: "Open EMT map and booking tools",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarAccessibilityLabel: "Open settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
