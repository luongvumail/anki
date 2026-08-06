import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, Radii } from "../../constants/theme";

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

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [bounceAnim]);

  const getIconAndBadge = () => {
    switch (expression) {
      case "celebrate":
        return { icon: "trophy" as const, bg: Colors.duolingo.yellow };
      case "happy":
        return { icon: "sparkles" as const, bg: Colors.duolingo.green };
      case "sad":
        return { icon: "heart-dislike" as const, bg: Colors.duolingo.red };
      case "thinking":
        return { icon: "bulb" as const, bg: Colors.duolingo.purple };
      case "waving":
      default:
        return { icon: "hand-left" as const, bg: Colors.duolingo.blue };
    }
  };

  const { icon, bg } = getIconAndBadge();

  return (
    <View style={styles.mascotContainer}>
      {speechBubbleText ? (
        <View style={styles.speechBubble}>
          <Text style={styles.speechBubbleText}>{speechBubbleText}</Text>
          <View style={styles.speechArrow} />
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
    marginVertical: 6,
  },
  mascotAvatar: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    borderBottomWidth: 4,
    borderBottomColor: "rgba(0, 0, 0, 0.25)",
  },
  speechBubble: {
    backgroundColor: Colors.duolingo.bgSoftDark,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
    borderWidth: 0,
    borderBottomWidth: 3,
    borderBottomColor: "#18242B",
    marginBottom: 8,
    maxWidth: 200,
    alignItems: "center",
  },
  speechBubbleText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  speechArrow: {
    position: "absolute",
    bottom: -6,
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 6,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: Colors.duolingo.bgSoftDark,
  },
});
