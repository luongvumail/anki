import React, { useState } from "react";
import {
  TouchableOpacity,
  View,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { Radii, Spacing } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

export interface DuolingoCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: "default" | "active" | "success" | "error";
  style?: ViewStyle;
  padding?: number;
}

export function DuolingoCard({
  children,
  onPress,
  variant = "default",
  style,
  padding = Spacing.md,
}: DuolingoCardProps) {
  const [pressed, setPressed] = useState(false);
  const { theme } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case "active":
        return {
          bg: theme.blueDim,
          border: theme.blue,
          borderBottom: theme.blueDark,
        };
      case "success":
        return {
          bg: theme.greenDim,
          border: theme.green,
          borderBottom: theme.greenDark,
        };
      case "error":
        return {
          bg: theme.redDim,
          border: theme.red,
          borderBottom: theme.redDark,
        };
      case "default":
      default:
        return {
          bg: theme.cardBg,
          border: theme.cardBorder,
          borderBottom: theme.cardBottom,
        };
    }
  };

  const vColors = getVariantStyle();

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        onPress={onPress}
        style={[
          styles.cardBase,
          {
            backgroundColor: vColors.bg,
            borderColor: vColors.border,
            borderBottomColor: vColors.borderBottom,
            borderBottomWidth: pressed ? 1 : 4,
            transform: [{ translateY: pressed ? 2 : 0 }],
            padding,
          },
          style,
        ]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[
        styles.cardBase,
        {
          backgroundColor: vColors.bg,
          borderColor: vColors.border,
          borderBottomColor: vColors.borderBottom,
          borderBottomWidth: 4,
          padding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  cardBase: {
    width: "100%",
    borderRadius: Radii.lg,
    borderWidth: 2,
    overflow: "hidden",
  },
});
