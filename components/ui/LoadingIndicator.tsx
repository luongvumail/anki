import React from "react";
import { View, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { Spacing, Typography, Radii } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface LoadingIndicatorProps {
  message?: string;
  size?: "small" | "large";
  style?: ViewStyle;
}

export const LoadingIndicator = React.memo(function LoadingIndicator({
  message = "Đang tải dữ liệu...",
  size = "large",
  style,
}: LoadingIndicatorProps) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={theme.blue} />
      {message ? <Text style={[styles.message, { color: theme.textMuted }]}>{message}</Text> : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    width: "100%",
  },
  card: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    borderRadius: Radii.xl,
    gap: Spacing.md,
    width: "100%",
  },
  message: {
    fontSize: Typography.caption1.fontSize,
    fontWeight: Typography.weight.semibold,
    textAlign: "center",
  },
});
