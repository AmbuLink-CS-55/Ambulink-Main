import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SocketProvider } from "@/common/hooks/SocketContext";
import FontAwesome5 from "@expo/vector-icons/FontAwesome5";
import { useAuthStore } from "@/common/hooks/AuthContext";

export default function TabLayout() {
  const hasAccessToken = useAuthStore((state) => Boolean(state.session?.accessToken));
  const insets = useSafeAreaInsets();
  const tabBarBaseHeight = 56;
  const tabBarBottomPadding = Math.max(insets.bottom, 8);

  return (
    <SocketProvider type="PATIENT" enabled={hasAccessToken}>
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarHideOnKeyboard: true,
          tabBarActiveTintColor: "#111827",
          tabBarInactiveTintColor: "#6b7280",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "600",
          },
          tabBarStyle: {
            height: tabBarBaseHeight + tabBarBottomPadding,
            paddingTop: 6,
            paddingBottom: tabBarBottomPadding,
            backgroundColor: "#ffffff",
            borderTopColor: "#e5e7eb",
            borderTopWidth: 1,
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
          name="firstAid"
          options={{
            title: "First-Aid",
            tabBarAccessibilityLabel: "Open first-aid",
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="first-aid" size={size} color={color} />
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
      </Tabs>
    </SocketProvider>
  );
}
