import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../store/useStore";
import { ALL_BADGES } from "../../store/slices/userProgressSlice";
import { Spacing, Typography, Layout, Radii } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
import { DuolingoCard } from "../ui/DuolingoCard";
import { SectionTitle } from "../ui/SectionTitle";

interface BadgesGalleryProps {
  streakCount?: number;
  learnedCards?: number;
}

export function BadgesGallery({ streakCount: propStreak, learnedCards: propLearned }: BadgesGalleryProps) {
  const { theme } = useTheme();
  const unlockedBadgeIds = useStore((s) => s.unlockedBadgeIds || []);
  const checkAndUnlockBadges = useStore((s) => s.checkAndUnlockBadges);

  const fallbackCards = useStore((s) => {
    let count = 0;
    Object.values(s.cards).forEach((list) => {
      count += list.filter((c) => c.srs && c.srs.repetitions > 0).length;
    });
    return count;
  });

  const streakCount = propStreak ?? 0;
  const learnedCardsCount = propLearned ?? fallbackCards;

  React.useEffect(() => {
    if (checkAndUnlockBadges) {
      checkAndUnlockBadges(streakCount, learnedCardsCount);
    }
  }, [streakCount, learnedCardsCount, checkAndUnlockBadges]);

  return (
    <View style={styles.container}>
      <SectionTitle>BỘ SƯU TẬP HUY HIỆU THÀNH TÍCH</SectionTitle>

      <View style={styles.badgeGrid}>
        {ALL_BADGES.map((badge) => {
          let isUnlocked = unlockedBadgeIds.includes(badge.id);
          let progressText = "";

          if (badge.category === "streak") {
            progressText = `${Math.min(badge.target, streakCount)}/${badge.target} ngày`;
            if (streakCount >= badge.target) isUnlocked = true;
          } else if (badge.category === "vocab") {
            progressText = `${Math.min(badge.target, learnedCardsCount)}/${badge.target} từ`;
            if (learnedCardsCount >= badge.target) isUnlocked = true;
          } else {
            progressText = isUnlocked ? "Đã đạt" : `Chưa mở`;
          }

          return (
            <DuolingoCard
              key={badge.id}
              style={StyleSheet.flatten([
                styles.badgeCard,
                {
                  borderColor: isUnlocked ? theme.yellow : theme.cardBorder,
                  opacity: isUnlocked ? 1 : 0.7,
                },
              ])}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: isUnlocked ? theme.yellowDim : theme.bgSoft },
                ]}
              >
                <Ionicons
                  name={badge.icon as any}
                  size={Layout.iconLg}
                  color={isUnlocked ? theme.yellow : theme.textMuted}
                />
              </View>

              <Text
                style={[
                  styles.badgeTitle,
                  { color: isUnlocked ? theme.textPrimary : theme.textMuted },
                ]}
                numberOfLines={1}
              >
                {badge.title}
              </Text>

              <Text style={[styles.badgeDesc, { color: theme.textMuted }]} numberOfLines={2}>
                {badge.description}
              </Text>

              <Text
                style={[
                  styles.progressText,
                  { color: isUnlocked ? theme.green : theme.textMuted },
                ]}
              >
                {isUnlocked ? "ĐÃ MỞ KHÓA" : progressText}
              </Text>
            </DuolingoCard>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: Spacing.md },
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.cellPadding },
  badgeCard: {
    width: "48%",
    padding: Spacing.sm,
    alignItems: "center",
  },
  iconBox: {
    width: Layout.avatarLg,
    height: Layout.avatarLg,
    borderRadius: Radii.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  badgeTitle: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: Typography.caption2.fontSize,
    textAlign: "center",
    marginTop: 2,
  },
  progressText: {
    fontSize: Typography.caption2.fontSize,
    fontWeight: Typography.weight.extraBold,
    marginTop: Spacing.xs,
  },
});
