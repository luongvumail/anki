import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../lib/firebase";
import { Radii, Spacing, Typography, Layout } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { useStore } from "../../store/useStore";

export interface AppHeaderProps {
  userName?: string;
  courseName?: string;
  streakCount?: number;
  gemsCount?: number;
  heartsCount?: number;
  onProfilePress?: () => void;
  onStreakPress?: () => void;
  onGemsPress?: () => void;
  onHeartsPress?: () => void;
}

export function AppHeader({
  userName,
  streakCount = 1,
  onProfilePress,
  onStreakPress,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const openAccountModal = useStore((s) => s.openAccountModal);
  const authUser = auth.currentUser;
  const resolvedName =
    userName || authUser?.displayName || (authUser?.email ? authUser.email.split("@")[0] : "Bạn");

  const handleAvatarPress = onProfilePress || openAccountModal;

  return (
    <View
      style={[
        styles.headerContainer,
        {
          paddingTop: Math.max(insets.top + Spacing.sm, Spacing.cellMinHeight),
          backgroundColor: theme.bg,
        },
      ]}
    >
      {/* Friendly User Greeting */}
      <View>
        <Text style={[styles.courseTitleText, { color: theme.textPrimary }]}>
          Xin chào, {resolvedName}
        </Text>
      </View>

      {/* Top Indicators Row */}
      <View style={styles.statsRow}>
        {/* Streak Pill */}
        <TouchableOpacity style={styles.statPill} activeOpacity={0.8} onPress={onStreakPress}>
          <Ionicons name="flame" size={Layout.iconMd} color={theme.yellow} />
          <Text style={[styles.statValue, { color: theme.yellow }]}>{streakCount}</Text>
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity style={styles.avatarBtn} onPress={handleAvatarPress} activeOpacity={0.8}>
          <Ionicons name="person-circle" size={Layout.iconXl} color={theme.blue} />
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },

  courseSelector: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 0,
  },
  courseTitleText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.3,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    paddingHorizontal: Spacing.cellPadding,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: 0,
  },
  statValue: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  avatarBtn: {
    paddingLeft: Spacing.xs,
  },
});
