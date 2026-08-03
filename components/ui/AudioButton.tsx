import React from "react";
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Colors, triggerHaptic } from "../../constants/theme";

interface AudioButtonProps {
  onPress: () => void;
  isPlaying?: boolean;
  size?: "sm" | "md" | "lg";
  style?: StyleProp<ViewStyle>;
  color?: string;
  backgroundColor?: string;
}

export function AudioButton({
  onPress,
  isPlaying = false,
  size = "md",
  style,
  color = Colors.duolingo.blue,
  backgroundColor = Colors.duolingo.blueDim,
}: AudioButtonProps) {
  const getDimensions = () => {
    switch (size) {
      case "sm":
        return { boxSize: 32, iconSize: 18 };
      case "lg":
        return { boxSize: 52, iconSize: 28 };
      case "md":
      default:
        return { boxSize: 38, iconSize: 22 };
    }
  };

  const { boxSize, iconSize } = getDimensions();

  const handlePress = () => {
    triggerHaptic("selection");
    onPress();
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          width: boxSize,
          height: boxSize,
          borderRadius: boxSize / 2,
          backgroundColor,
        },
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.75}
      hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
    >
      <Ionicons
        name={isPlaying ? "volume-high" : "volume-medium"}
        size={iconSize}
        color={color}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
});
