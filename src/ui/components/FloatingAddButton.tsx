import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { theme } from "../theme/theme.js";
import { Icon } from "./Icon.js";

export interface FloatingAddButtonProps {
  onPress: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onPress }) => {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel="Thêm thẻ từ vựng mới bằng AI"
      style={({ pressed }) => [
        styles.fab,
        {
          opacity: pressed ? 0.8 : 1,
          transform: [{ scale: pressed ? 0.95 : 1 }],
        },
      ]}
    >
      <Icon name="sparkles" size={28} color={theme.colors.white} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 80,
    right: theme.spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 900,
    ...theme.shadows.lg,
  },
});
