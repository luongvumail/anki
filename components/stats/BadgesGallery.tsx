import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAppStore } from "../../src/ui/store/useAppStore";
import { ALL_BADGES } from "../../src/domain/user/userProgress";
import { Colors, Typography, Spacing, Radii } from "../../constants/theme";
import { DuolingoCard } from "../ui/DuolingoCard";
import { SectionTitle } from "../ui/SectionTitle";

import { computeLearnedCount } from "../../src/domain/card/cardUtils";

interface BadgesGalleryProps {
  streakCount?: number;
  learnedCards?: number;
}

export function BadgesGallery({
  streakCount: propStreak,
  learnedCards: propLearned,
}: BadgesGalleryProps) {
  const unlockedBadgeIds = useAppStore((s) => s.unlockedBadgeIds || []);
  const checkAndUnlockBadges = useAppStore((s) => s.checkAndUnlockBadges);

  const fallbackCards = useAppStore((s) => {
    let count = 0;
    Object.values(s.cards).forEach((list) => {
      count += computeLearnedCount(list);
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
              style={
                [
                  styles.badgeCard,
                  isUnlocked ? styles.badgeUnlockedCard : styles.badgeLockedCard,
                ] as any
              }
            >
              <View style={[styles.iconBox, isUnlocked ? styles.iconUnlocked : styles.iconLocked]}>
                <Ionicons
                  name={badge.icon as any}
                  size={24}
                  color={isUnlocked ? Colors.duolingo.yellow : Colors.duolingo.textMuted}
                />
              </View>

              <Text
                style={[styles.badgeTitle, isUnlocked && styles.badgeTitleUnlocked]}
                numberOfLines={1}
              >
                {badge.title}
              </Text>

              <Text style={styles.badgeDesc} numberOfLines={2}>
                {badge.description}
              </Text>

              <Text style={[styles.progressText, isUnlocked && styles.progressUnlockedText]}>
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
  badgeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  badgeCard: {
    width: "48%",
    padding: Spacing.sm,
    alignItems: "center",
  },
  badgeUnlockedCard: {
    borderColor: Colors.duolingo.yellow,
  },
  badgeLockedCard: {
    opacity: 0.7,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  iconUnlocked: {
    backgroundColor: "rgba(255, 200, 0, 0.15)",
  },
  iconLocked: {
    backgroundColor: Colors.duolingo.bg,
  },
  badgeTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    textAlign: "center",
  },
  badgeTitleUnlocked: {
    color: "#FFFFFF",
  },
  badgeDesc: {
    fontSize: 11,
    color: Colors.duolingo.textMuted,
    textAlign: "center",
    marginTop: 2,
  },
  progressText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    marginTop: 6,
  },
  progressUnlockedText: {
    color: Colors.duolingo.green,
  },
});
