import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { theme } from "../theme/theme.js";

export interface DuolingoButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "info";
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const DuolingoButton: React.FC<DuolingoButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const getColors = () => {
    switch (variant) {
      case "secondary":
        return { bg: theme.colors.secondary, shadow: theme.colors.secondaryShadow };
      case "danger":
        return { bg: theme.colors.danger, shadow: theme.colors.dangerShadow };
      case "info":
        return { bg: theme.colors.info, shadow: theme.colors.infoShadow };
      default:
        return { bg: theme.colors.primary, shadow: theme.colors.primaryShadow };
    }
  };

  const { bg, shadow } = getColors();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      aria-label={accessibilityLabel || title}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: disabled ? theme.colors.textLight : bg,
          borderBottomColor: disabled ? theme.colors.textSecondary : shadow,
          opacity: pressed ? 0.9 : 1,
          transform: [{ translateY: pressed ? 2 : 0 }],
        },
      ]}
    >
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 48,
  },
  text: {
    color: theme.colors.white,
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
  },
});
