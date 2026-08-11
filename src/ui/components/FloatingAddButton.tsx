import React, { useRef } from "react";
import { Animated, PanResponder, StyleSheet, View } from "react-native";
import { theme } from "../theme/theme.js";
import { Icon } from "./Icon.js";

export interface FloatingAddButtonProps {
  onPress: () => void;
}

// Global position shared across all screen instances of FloatingAddButton
let globalFabPosition = { x: 0, y: 0 };

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onPress }) => {
  const pan = useRef(new Animated.ValueXY(globalFabPosition)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
        useNativeDriver: false,
      }),
      onPanResponderRelease: (_, gestureState) => {
        pan.flattenOffset();
        globalFabPosition = {
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        };

        // If gesture moved <= 5px, handle tap
        if (Math.abs(gestureState.dx) <= 5 && Math.abs(gestureState.dy) <= 5) {
          onPress();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.fab,
        {
          transform: pan.getTranslateTransform(),
        },
      ]}
    >
      <View style={styles.innerPress}>
        <Icon name="sparkles" size={28} color={theme.colors.white} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    bottom: 90,
    right: theme.spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 999,
    ...theme.shadows.lg,
  },
  innerPress: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
  },
});
