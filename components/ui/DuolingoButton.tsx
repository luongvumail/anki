import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from "react-native";
import { Radii, Layout, Spacing, Typography, BorderWidths } from "../../constants/theme";
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
        bg: theme.cardBg,
        border: theme.cardBorder,
        bottom: theme.cardBottom,
        text: theme.textMuted,
      };
    }

    switch (variant) {
      case "primary":
      case "success":
        return {
          bg: theme.green,
          border: theme.green,
          bottom: theme.greenDark,
          text: "#FFFFFF",
        };
      case "blue":
        return {
          bg: theme.blue,
          border: theme.blue,
          bottom: theme.blueDark,
          text: "#FFFFFF",
        };
      case "error":
        return {
          bg: theme.red,
          border: theme.red,
          bottom: theme.redDark,
          text: "#FFFFFF",
        };
      case "purple":
        return {
          bg: theme.purple,
          border: theme.purple,
          bottom: theme.purpleDark,
          text: "#FFFFFF",
        };
      case "yellow":
        return {
          bg: theme.yellow,
          border: theme.yellow,
          bottom: theme.yellowDark,
          text: theme.textInverse,
        };
      case "secondary":
        return {
          bg: theme.cardBg,
          border: theme.cardBorder,
          bottom: theme.cardBottom,
          text: theme.textPrimary,
        };
      case "ghost":
        return {
          bg: "transparent",
          border: "transparent",
          bottom: "transparent",
          text: theme.textMuted,
        };
    }
  };

  const vColors = getVariantStyles();

  const handlePressIn = () => {
    if (disabled) return;
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
          borderColor: vColors.border,
          borderWidth: variant === "ghost" ? BorderWidths.none : BorderWidths.thin,
          borderBottomColor: vColors.bottom,
          borderBottomWidth: variant === "ghost" ? BorderWidths.none : pressed ? BorderWidths.thin : BorderWidths.card3D,
          transform: [{ translateY: pressed ? 2 : 0 }],
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
