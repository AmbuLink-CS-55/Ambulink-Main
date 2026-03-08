import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SocketProvider } from "@/common/hooks/SocketContext";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarBaseHeight = 56;
  const tabBarBottomPadding = Math.max(insets.bottom, 8);

  return (
    <SocketProvider type="PATIENT" enabled>
      <Tabs
        screenOptions={{
          headerShown: false,
          lazy: true,
          freezeOnBlur: true,
          tabBarHideOnKeyboard: true,
          tabBarStyle: {
            height: tabBarBaseHeight + tabBarBottomPadding,
            paddingTop: 6,
            paddingBottom: tabBarBottomPadding,
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
      </Tabs>
    </SocketProvider>
  );
}
