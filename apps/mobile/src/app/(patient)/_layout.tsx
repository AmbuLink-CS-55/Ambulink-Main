import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SocketProvider } from "@/common/hooks/SocketContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";

export default function TabLayout() {
  return (
    <SocketProvider type="PATIENT" enabled>
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: 64,
            paddingTop: 6,
            paddingBottom: 8,
          },
        }}
      >
        <Tabs.Screen
          name="map"
          options={{
            title: "Map",
            tabBarAccessibilityLabel: "Open live map",
            tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: "History",
            tabBarAccessibilityLabel: "Open trip history",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="albums-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: "Settings",
            tabBarAccessibilityLabel: "Open settings",
            tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="firstAid"
          options={{
            title: "First-Aid",
            tabBarAccessibilityLabel: "Open first-aid",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="first-aid" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </SocketProvider>
  );
}
