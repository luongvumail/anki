import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../theme/ThemeContext.js";

export interface DuolingoCardProps {
  children: React.ReactNode;
  borderColor?: string;
  backgroundColor?: string;
  accessibilityLabel?: string;
}

export const DuolingoCard: React.FC<DuolingoCardProps> = ({
  children,
  backgroundColor,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const bg = backgroundColor || theme.colors.cardBg;

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.card,
        {
          backgroundColor: bg,
          shadowColor: theme.isDark ? "#000000" : "#000000",
        },
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
});

