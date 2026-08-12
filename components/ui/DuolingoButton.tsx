import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Radii, Layout, Spacing, Typography, BorderWidths, triggerHaptic } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

export type DuolingoButtonVariant =
  | "primary"
  | "success"
  | "blue"
  | "error"
  | "purple"
  | "yellow"
  | "secondary"
  | "ghost";

export type DuolingoButtonSize = "lg" | "md" | "sm";

export interface DuolingoButtonProps {
  title: string;
  onPress: () => void;
  variant?: DuolingoButtonVariant;
  size?: DuolingoButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  height?: number;
}

export function DuolingoButton({
  title,
  onPress,
  variant = "primary",
  size = "lg",
  disabled = false,
  style,
  textStyle,
  icon,
  height,
}: DuolingoButtonProps) {
  const [pressed, setPressed] = useState(false);
  const { theme } = useTheme();

  const getSizeStyle = () => {
    switch (size) {
      case "sm":
        return {
          height: height || Layout.btnHeightSm,
          fontSize: Typography.text.caption2.fontSize,
          paddingHorizontal: Spacing.md,
        };
      case "md":
        return {
          height: height || Layout.btnHeightMd,
          fontSize: Typography.caption.fontSize,
          paddingHorizontal: Spacing.cellPadding,
        };
      case "lg":
      default:
        return {
          height: height || Layout.btnHeightLg,
          fontSize: Typography.subhead.fontSize,
          paddingHorizontal: Spacing.lg,
        };
    }
  };

  const sizeStyle = getSizeStyle();

  const getVariantStyles = () => {
    if (disabled) {
      return {
        bg: theme.bgSoft,
        text: theme.textMuted,
      };
    }

    switch (variant) {
      case "primary":
      case "blue":
        return {
          bg: theme.blue,
          text: "#FFFFFF",
        };
      case "success":
        return {
          bg: theme.green,
          text: "#FFFFFF",
        };
      case "error":
        return {
          bg: theme.red,
          text: "#FFFFFF",
        };
      case "yellow":
        return {
          bg: theme.yellow,
          text: "#FFFFFF",
        };
      case "purple":
        return {
          bg: theme.purple,
          text: "#FFFFFF",
        };
      case "secondary":
        return {
          bg: theme.bgSoft,
          text: theme.textPrimary,
        };
      case "ghost":
      default:
        return {
          bg: "transparent",
          text: theme.textMuted,
        };
    }
  };

  const vColors = getVariantStyles();

  const handlePressIn = () => {
    if (disabled) return;
    triggerHaptic("light");
    setPressed(true);
  };

  const handlePressOut = () => {
    if (disabled) return;
    setPressed(false);
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      style={[
        styles.buttonBase,
        {
          height: sizeStyle.height,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          backgroundColor: vColors.bg,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          opacity: pressed ? 0.92 : 1,
        },
        style,
      ]}
    >
      {icon && icon}
      <Text
        style={[
          styles.buttonText,
          {
            fontSize: sizeStyle.fontSize,
            color: vColors.text,
          },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  buttonBase: {
    width: "100%",
    borderRadius: Radii.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  buttonText: {
    fontWeight: Typography.weight.extraBold,
    letterSpacing: 0.5,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    textTransform: "uppercase",
  },
});
