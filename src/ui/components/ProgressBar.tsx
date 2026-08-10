import React from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "../theme/theme.js";

export interface ProgressBarProps {
  progress: number; // 0 to 100
  height?: number;
  color?: string;
  accessibilityLabel?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 12,
  color = theme.colors.primary,
  accessibilityLabel = "Thanh tiến trình học",
}) => {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.track,
        {
          height,
          borderRadius: height / 2,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clamped}%`,
            height: "100%",
            backgroundColor: color,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  track: {
    width: "100%",
    backgroundColor: theme.colors.cardBorder,
    overflow: "hidden",
  },
  fill: {},
});
