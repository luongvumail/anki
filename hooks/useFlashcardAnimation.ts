import { useState, useRef, useCallback } from "react";
import { Animated } from "react-native";
import * as Speech from "expo-speech";
import { triggerHaptic } from "../constants/theme";
import { APP_CONFIG } from "../constants/config";

export function useFlashcardAnimation(character: string) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const handleFlip = useCallback(() => {
    triggerHaptic("selection");
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(false));
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        friction: 8,
        tension: 10,
        useNativeDriver: true,
      }).start(() => setIsFlipped(true));
    }
  }, [isFlipped, flipAnim]);

  const playTTS = useCallback(() => {
    if (!character) return;
    setSpeaking(true);
    Speech.stop();
    Speech.speak(character, {
      language: "zh-CN",
      rate: APP_CONFIG.SPEECH_RATE,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, [character]);

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["0deg", "180deg"],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ["180deg", "360deg"],
  });

  const frontAnimatedStyle = {
    transform: [{ rotateY: frontInterpolate }],
  };

  const backAnimatedStyle = {
    transform: [{ rotateY: backInterpolate }],
  };

  return {
    isFlipped,
    speaking,
    frontAnimatedStyle,
    backAnimatedStyle,
    handleFlip,
    playTTS,
  };
}
