import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme.js";

export type BadgeVariant = "due" | "learned" | "new" | "warning" | "info" | "neutral";

export interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  label,
  children,
  icon,
  size = "md",
}) => {
  const token = theme.badges[variant] || theme.badges.neutral;
  const isSm = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: token.bg,
          borderColor: token.border,
          paddingVertical: isSm ? theme.spacing.xs / 2 : theme.spacing.xs,
          paddingHorizontal: isSm ? theme.spacing.sm : theme.spacing.md,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.text,
          {
            color: token.text,
            fontSize: isSm ? theme.fontSize.xs : theme.fontSize.sm,
          },
        ]}
      >
        {label || (children as string)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.xs,
    alignSelf: "flex-start",
  },
  text: {
    fontWeight: theme.fontWeight.bold,
  },
});
