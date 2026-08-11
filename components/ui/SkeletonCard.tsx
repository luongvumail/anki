import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, ViewStyle } from "react-native";
import { Colors, Radii, Spacing } from "../../constants/theme";

interface SkeletonCardProps {
  lines?: number;
  style?: ViewStyle;
}

export const SkeletonCard = React.memo(({ lines = 2, style }: SkeletonCardProps) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <View style={[styles.cardContainer, style]}>
      <View style={styles.headerRow}>
        <Animated.View style={[styles.avatarSkeleton, { opacity: pulseAnim }]} />
        <View style={styles.headerTextCol}>
          <Animated.View style={[styles.titleSkeleton, { opacity: pulseAnim }]} />
          <Animated.View style={[styles.subtitleSkeleton, { opacity: pulseAnim }]} />
        </View>
      </View>
      {Array.from({ length: lines }).map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.lineSkeleton,
            { opacity: pulseAnim, width: index === lines - 1 ? "60%" : "100%" },
          ]}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  avatarSkeleton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.duolingo.cardBottom,
  },
  headerTextCol: {
    flex: 1,
    gap: 6,
  },
  titleSkeleton: {
    height: 16,
    width: "50%",
    borderRadius: Radii.sm,
    backgroundColor: Colors.duolingo.cardBottom,
  },
  subtitleSkeleton: {
    height: 12,
    width: "35%",
    borderRadius: Radii.sm,
    backgroundColor: Colors.duolingo.cardBottom,
  },
  lineSkeleton: {
    height: 12,
    borderRadius: Radii.sm,
    backgroundColor: Colors.duolingo.cardBottom,
    marginTop: 8,
  },
});
