import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { authService } from "../../infrastructure/auth/authService.js";
import { appStore } from "../store/useAppStore.js";
import { useTheme } from "../theme/ThemeContext.js";
import { Icon } from "./Icon.js";

export interface GlobalHeaderProps {
  onOpenProfile: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ onOpenProfile }) => {
  const { theme } = useTheme();
  const [userProgress, setUserProgress] = useState(() => appStore.getState().userProgress);

  useEffect(() => {
    const unsub = appStore.subscribe(() => {
      setUserProgress(appStore.getState().userProgress);
    });
    return unsub;
  }, []);

  const currentUser = authService.getCurrentUser();
  const displayName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Học viên";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.bg,
          borderBottomColor: theme.colors.cardBorder || "rgba(0,0,0,0.06)",
        },
      ]}
    >
      {/* Left side: Streak & XP Pill Badges */}
      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: theme.badges.warning.bg }]}>
          <Icon name="flame" size={18} color={theme.colors.secondary} />
          <Text style={[styles.statText, { color: theme.colors.secondary }]}>
            {userProgress.streakDays}
          </Text>
        </View>

        <View style={[styles.statPill, { backgroundColor: theme.badges.learned.bg }]}>
          <Icon name="zap" size={18} color={theme.colors.primary} />
          <Text style={[styles.statText, { color: theme.colors.primary }]}>
            {userProgress.totalXp}
          </Text>
        </View>
      </View>

      {/* Right side (sát bên phải): Avatar & Profile Trigger */}
      <Pressable
        onPress={onOpenProfile}
        style={styles.profileClickableArea}
        accessibilityLabel="Mở màn hình Hồ sơ & Cài đặt"
      >
        <View style={[styles.avatarRing, { borderColor: theme.colors.primary }]}>
          <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={[styles.gearBadge, { backgroundColor: theme.colors.cardBg }]}>
            <Icon name="wrench" size={10} color={theme.colors.primary} />
          </View>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statText: {
    fontSize: 13,
    fontWeight: "800",
  },
  profileClickableArea: {
    paddingVertical: 2,
    paddingLeft: 12,
  },
  profileBadgeGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  profileLabelText: {
    fontSize: 12,
    fontWeight: "700",
  },
  avatarRing: {
    position: "relative",
    padding: 2,
    borderRadius: 20,
    borderWidth: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
  },
  gearBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});


