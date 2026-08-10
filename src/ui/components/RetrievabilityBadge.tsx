import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme.js";
import { Icon } from "./Icon.js";

export interface RetrievabilityBadgeProps {
  retrievability: number; // 0.0 to 1.0
}

export const RetrievabilityBadge: React.FC<RetrievabilityBadgeProps> = ({ retrievability }) => {
  const percentage = Math.round(retrievability * 100);
  const token =
    percentage >= 80
      ? theme.badges.learned
      : percentage >= 50
      ? theme.badges.warning
      : theme.badges.due;

  return (
    <View
      accessibilityLabel={`Khả năng ghi nhớ R: ${percentage}%`}
      style={[
        styles.container,
        {
          backgroundColor: token.bg,
          borderColor: token.border,
        },
      ]}
    >
      <Icon name="brain" size={14} color={token.text} />
      <Text style={[styles.text, { color: token.text }]}>Nhớ {percentage}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  text: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
  },
});
