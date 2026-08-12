import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Radii, Spacing, Typography, BorderWidths, Animations } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";

export type MascotExpression = "waving" | "celebrate" | "happy" | "thinking" | "sad";

interface DuolingoMascotProps {
  expression?: MascotExpression;
  size?: number;
  speechBubbleText?: string;
}

export function DuolingoMascot({
  expression = "waving",
  size = 72,
  speechBubbleText,
}: DuolingoMascotProps) {
  const bounceAnim = useRef(new Animated.Value(0)).current;
  const { theme } = useTheme();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -Spacing.sm,
          duration: Animations.timingLong,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: Animations.timingLong,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [bounceAnim]);

  const getIconAndBadge = () => {
    switch (expression) {
      case "celebrate":
        return { icon: "trophy" as const, bg: theme.yellow };
      case "happy":
        return { icon: "sparkles" as const, bg: theme.green };
      case "sad":
        return { icon: "heart-dislike" as const, bg: theme.red };
      case "thinking":
        return { icon: "bulb" as const, bg: theme.purple };
      case "waving":
      default:
        return { icon: "hand-left" as const, bg: theme.blue };
    }
  };

  const { icon, bg } = getIconAndBadge();

  return (
    <View style={styles.mascotContainer}>
      {speechBubbleText ? (
        <View style={[styles.speechBubble, { backgroundColor: theme.cardBg, borderBottomColor: theme.cardBottom }]}>
          <Text style={[styles.speechBubbleText, { color: theme.textPrimary }]}>{speechBubbleText}</Text>
          <View style={[styles.speechArrow, { borderTopColor: theme.cardBg }]} />
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.mascotAvatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bg,
            transform: [{ translateY: bounceAnim }],
          },
        ]}
      >
        <Ionicons name={icon} size={size * 0.5} color="#FFFFFF" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  mascotContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: Spacing.xs,
  },
  mascotAvatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: BorderWidths.none,
    borderBottomWidth: BorderWidths.card3D,
    borderBottomColor: "rgba(0, 0, 0, 0.25)",
  },
  speechBubble: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.md,
    borderWidth: BorderWidths.none,
    borderBottomWidth: BorderWidths.default,
    marginBottom: Spacing.sm,
    maxWidth: 200,
    alignItems: "center",
  },
  speechBubbleText: {
    fontSize: Typography.caption1.fontSize,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
  },
  speechArrow: {
    position: "absolute",
    bottom: -Spacing.xs,
    width: 0,
    height: 0,
    borderLeftWidth: Spacing.xs,
    borderRightWidth: Spacing.xs,
    borderTopWidth: Spacing.xs,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
});
