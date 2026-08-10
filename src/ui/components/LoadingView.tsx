import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { theme } from "../theme/theme.js";

export interface LoadingViewProps {
  message?: string;
}

export const LoadingView: React.FC<LoadingViewProps> = ({ message = "Đang tải dữ liệu..." }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={theme.colors.primary} style={styles.spinner} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.hero,
    paddingHorizontal: theme.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {
    marginBottom: theme.spacing.md,
  },
  text: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.fontWeight.bold,
  },
});
