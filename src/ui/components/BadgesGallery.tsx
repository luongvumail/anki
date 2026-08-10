import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { ALL_BADGES } from "../../domain/user/userProgress.js";
import { theme } from "../theme/theme.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";
import { StatusBadge } from "./StatusBadge.js";

export interface BadgesGalleryProps {
  streakCount?: number;
  learnedCards?: number;
}

export const BadgesGallery: React.FC<BadgesGalleryProps> = ({
  streakCount = 0,
  learnedCards = 0,
}) => {
  return (
    <DuolingoCard accessibilityLabel="Bộ sưu tập huy hiệu thành tích">
      <View style={styles.header}>
        <Icon name="trophy" color={theme.colors.secondary} />
        <Text style={styles.headerTitle}>Bộ Sưu Tập Huy Hiệu Thành Tích</Text>
      </View>

      <View style={styles.grid}>
        {ALL_BADGES.map((badge) => {
          let isUnlocked = false;
          let progressText = "";

          if (badge.category === "streak") {
            const current = Math.min(badge.target, streakCount);
            progressText = `${current}/${badge.target} ngày`;
            if (streakCount >= badge.target) isUnlocked = true;
          } else if (badge.category === "vocab") {
            const current = Math.min(badge.target, learnedCards);
            progressText = `${current}/${badge.target} từ`;
            if (learnedCards >= badge.target) isUnlocked = true;
          } else {
            progressText = isUnlocked ? "Đã đạt" : "Chưa mở";
          }

          return (
            <View
              key={badge.id}
              style={[
                styles.badgeBox,
                {
                  backgroundColor: isUnlocked
                    ? theme.badges.learned.bg
                    : theme.badges.neutral.bg,
                  borderColor: isUnlocked
                    ? theme.colors.primary
                    : theme.colors.cardBorder,
                  opacity: isUnlocked ? 1 : 0.7,
                },
              ]}
            >
              <View style={styles.iconWrapper}>
                <Icon
                  name={badge.icon as any}
                  size={28}
                  color={isUnlocked ? theme.colors.secondary : theme.colors.textLight}
                />
              </View>
              <Text
                style={[
                  styles.badgeTitle,
                  { color: isUnlocked ? theme.colors.textPrimary : theme.colors.textSecondary },
                ]}
              >
                {badge.title}
              </Text>
              <Text style={styles.badgeDesc}>{badge.description}</Text>
              <StatusBadge
                variant={isUnlocked ? "learned" : "neutral"}
                label={isUnlocked ? "ĐÃ MỞ KHÓA" : progressText}
                size="sm"
              />
            </View>
          );
        })}
      </View>
    </DuolingoCard>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  headerTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
  },
  badgeBox: {
    width: "47%",
    borderWidth: 2,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    alignItems: "center",
    textAlign: "center",
  },
  iconWrapper: {
    marginBottom: theme.spacing.xs,
  },
  badgeTitle: {
    fontWeight: theme.fontWeight.bold,
    fontSize: theme.fontSize.sm,
    textAlign: "center",
  },
  badgeDesc: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
    marginBottom: theme.spacing.xs,
  },
});
