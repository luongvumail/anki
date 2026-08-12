import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { Radii, Spacing, Layout, BorderWidths, Animations } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

interface SkeletonCardProps {
  lines?: number;
  style?: ViewStyle;
}

export const SkeletonCard = React.memo(({ lines = 2, style }: SkeletonCardProps) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const { theme } = useTheme();

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: Animations.timingLong,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: Animations.timingLong,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.cardBg,
          borderColor: theme.cardBorder,
        },
        style,
      ]}
    >
      <View style={styles.headerRow}>
        <Animated.View style={[styles.avatarSkeleton, { opacity: pulseAnim, backgroundColor: theme.cardBottom }]} />
        <View style={styles.headerTextCol}>
          <Animated.View style={[styles.titleSkeleton, { opacity: pulseAnim, backgroundColor: theme.cardBottom }]} />
          <Animated.View style={[styles.subtitleSkeleton, { opacity: pulseAnim, backgroundColor: theme.cardBottom }]} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.lineSkeleton,
            { opacity: pulseAnim, width: index === lines - 1 ? "60%" : "100%", backgroundColor: theme.cardBottom },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.cellPadding,
    borderWidth: BorderWidths.default,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  avatarSkeleton: {
    width: Layout.avatarLg,
    height: Layout.avatarLg,
    borderRadius: Radii.md,
  },
  headerTextCol: {
    flex: 1,
    gap: Spacing.sm,
  },
  titleSkeleton: {
    height: Spacing.lg,
    width: "50%",
    borderRadius: Radii.sm,
  },
  subtitleSkeleton: {
    height: Spacing.md,
    width: "35%",
    borderRadius: Radii.sm,
  },
  lineSkeleton: {
    height: Spacing.md,
    borderRadius: Radii.sm,
    marginTop: Spacing.sm,
  },
});
