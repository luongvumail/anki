import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../../theme/theme.js";
import { useTheme } from "../../theme/ThemeContext.js";
import { DuolingoCard } from "../DuolingoCard.js";
import { ProgressBar } from "../ProgressBar.js";
import { StatusBadge } from "../StatusBadge.js";

export interface RetentionCardProps {
  retentionRatePct: number;
}

export const RetentionCard: React.FC<RetentionCardProps> = ({ retentionRatePct }) => {
  const { theme: currentTheme } = useTheme();

  return (
    <DuolingoCard accessibilityLabel="Tiến độ thuộc từ vựng">
      <View style={styles.retentionHeader}>
        <View style={styles.retentionInfo}>
          <Text style={[styles.retentionTitle, { color: currentTheme.colors.textPrimary }]}>
            TIẾN ĐỘ THUỘC TỪ VỰNG
          </Text>
          <Text style={[styles.retentionText, { color: currentTheme.colors.textSecondary }]}>
            {retentionRatePct === 100
              ? "Xuất sắc! Bạn đã thuộc 100% vốn từ hiện tại"
              : `Bạn đã ghi nhớ thuộc ${retentionRatePct}% tổng từ vựng`}
          </Text>
        </View>
        <StatusBadge variant="learned" label={`${retentionRatePct}%`} />
      </View>
      <ProgressBar progress={retentionRatePct} color={currentTheme.colors.primary} />
    </DuolingoCard>
  );
};

const styles = StyleSheet.create({
  retentionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.md,
  },
  retentionInfo: {
    flex: 1,
  },
  retentionTitle: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
  },
  retentionText: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
});
