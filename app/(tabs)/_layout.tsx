import React from "react";
import { Tabs } from "expo-router";
import { StyleSheet, Platform, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Spacing, Typography, Layout, BorderWidths } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { GlobalAccountModal } from "../../components/home/GlobalAccountModal";

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: [
            styles.tabBar,
            {
              backgroundColor: theme.bg,
            },
          ],

          tabBarActiveTintColor: theme.blue,
          tabBarInactiveTintColor: theme.textMuted,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Học",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? "home" : "home-outline"} size={Layout.iconLg} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="decks"
          options={{
            title: "Từ vựng",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? "book" : "book-outline"} size={Layout.iconLg} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="practice"
          options={{
            title: "Luyện tập",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? "extension-puzzle" : "extension-puzzle-outline"} size={Layout.iconLg} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Thống kê",
            tabBarIcon: ({ focused, color }) => (
              <Ionicons name={focused ? "stats-chart" : "stats-chart-outline"} size={Layout.iconLg} color={color} />
            ),
          }}
        />
      </Tabs>
      <GlobalAccountModal />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    height: Platform.OS === "ios" ? 86 : 66,
    paddingBottom: Platform.OS === "ios" ? 26 : Spacing.sm,
    paddingTop: Spacing.xs,
  },

  tabItem: {
    paddingTop: Spacing.xs,
  },
  tabLabel: {
    fontSize: Typography.caption2.fontSize,
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.3,
    marginTop: Spacing.xs,
  },
});
