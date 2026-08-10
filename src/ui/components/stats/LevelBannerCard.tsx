import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { getLevelInfo } from "../../../domain/user/userProgress.js";
import { theme } from "../../theme/theme.js";
import { useTheme } from "../../theme/ThemeContext.js";
import { DuolingoCard } from "../DuolingoCard.js";
import { Icon } from "../Icon.js";
import { ProgressBar } from "../ProgressBar.js";

export type LevelInfo = ReturnType<typeof getLevelInfo>;

export interface LevelBannerCardProps {
  levelInfo: LevelInfo;
  totalXp: number;
}

export const LevelBannerCard: React.FC<LevelBannerCardProps> = ({ levelInfo, totalXp }) => {
  const { theme: currentTheme } = useTheme();

  return (
    <DuolingoCard accessibilityLabel="Cấp độ người dùng">
      <View style={styles.bannerRow}>
        <View style={styles.levelHeader}>
          <View style={styles.badgeRow}>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>LV.{levelInfo.level}</Text>
            </View>
            <Text style={[styles.levelTitle, { color: currentTheme.colors.textPrimary }]}>
              {levelInfo.title}
            </Text>
            <Text style={[styles.levelSubtitle, { color: currentTheme.colors.textSecondary }]}>
              ({levelInfo.titleVi})
            </Text>
          </View>
          <Text style={styles.xpText}>{totalXp} XP Tích Lũy</Text>
        </View>
        <Icon name="trophy" size={36} color={currentTheme.colors.secondary} />
      </View>
      <ProgressBar progress={levelInfo.progress * 100} color={currentTheme.colors.secondary} />
    </DuolingoCard>
  );
};

const styles = StyleSheet.create({
  bannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  levelHeader: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
  },
  levelBadge: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.xs,
    borderRadius: theme.radius.sm,
  },
  levelBadgeText: {
    color: theme.colors.white,
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
  levelTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  levelSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  xpText: {
    marginTop: 4,
    color: theme.colors.secondary,
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
  },
});
