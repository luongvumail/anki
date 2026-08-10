import React from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "../theme/theme.js";

export interface DuolingoCardProps {
  children: React.ReactNode;
  borderColor?: string;
  backgroundColor?: string;
  accessibilityLabel?: string;
}

export const DuolingoCard: React.FC<DuolingoCardProps> = ({
  children,
  borderColor = theme.colors.cardBorder,
  backgroundColor = theme.colors.cardBg,
  accessibilityLabel,
}) => {
  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
          borderBottomColor: borderColor,
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    padding: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
});
