import React, { useState } from "react";
import { TouchableOpacity, View, StyleSheet, ViewStyle } from "react-native";
import { Colors, Radii, Spacing } from "../../constants/theme";

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

  const getVariantStyle = () => {
    switch (variant) {
      case "active":
        return {
          bg: Colors.duolingo.cardBgActive,
          borderBottom: Colors.duolingo.blue,
        };
      case "success":
        return {
          bg: Colors.duolingo.greenDark,
          borderBottom: Colors.duolingo.green,
        };
      case "error":
        return {
          bg: Colors.duolingo.redDark,
          borderBottom: Colors.duolingo.red,
        };
      case "default":
      default:
        return {
          bg: Colors.duolingo.bgSoft,
          borderBottom: Colors.duolingo.cardBottom,
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
            borderBottomColor: vColors.borderBottom,
            borderBottomWidth: pressed ? 1 : 3,
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
          borderBottomColor: vColors.borderBottom,
          borderBottomWidth: 3,
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
    borderRadius: Radii.lg, // --radius-lg: 16px
    borderWidth: 0, // KHÔNG border mảnh bao quanh (Rule 2)
    overflow: "hidden",
  },
});
