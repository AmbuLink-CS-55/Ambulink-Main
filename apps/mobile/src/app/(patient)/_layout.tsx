import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SocketProvider } from "@/hooks/SocketContext";

export default function TabLayout() {
  return (
    <SocketProvider type="PATIENT" enabled>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#26A69A",
          tabBarInactiveTintColor: "#999",
        }}
      >
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="albums-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SocketProvider>
  );
}
