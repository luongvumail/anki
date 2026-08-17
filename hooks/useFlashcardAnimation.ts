import { useState, useRef, useCallback, useEffect } from "react";
import { Animated } from "react-native";
import * as Speech from "expo-speech";
import { triggerHaptic } from "../constants/theme";
import { APP_CONFIG } from "../constants/config";

export function useFlashcardAnimation(
  character: string = "",
  initialRevealed: boolean = false,
  onReveal?: () => void,
) {
  const [isRevealed, setIsRevealed] = useState(initialRevealed);
  const [speaking, setSpeaking] = useState(false);
  const detailAnim = useRef(new Animated.Value(initialRevealed ? 1 : 0)).current;

  // Sync animation state when character or initialRevealed changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsRevealed(initialRevealed);
    detailAnim.setValue(initialRevealed ? 1 : 0);
  }, [character, initialRevealed, detailAnim]);

  const handleToggleDetail = useCallback(() => {
    if (isRevealed) return;

    triggerHaptic("selection");
    setIsRevealed(true);

    Animated.spring(detailAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    if (onReveal) {
      onReveal();
    }
  }, [isRevealed, detailAnim, onReveal]);

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

  // Interpolations for smooth detail reveal while maintaining exact center positioning
  const hanziShiftY = detailAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0],
  });

  const detailTranslateY = detailAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });


  const detailOpacity = detailAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.5, 1],
  });

  const hintOpacity = detailAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0, 0],
  });

  const hanziAnimatedStyle = {
    transform: [{ translateY: hanziShiftY }],
  };

  const detailAnimatedStyle = {
    opacity: detailOpacity,
    transform: [{ translateY: detailTranslateY }],
  };

  const hintAnimatedStyle = {
    opacity: hintOpacity,
  };

  return {
    isRevealed,
    speaking,
    hanziAnimatedStyle,
    detailAnimatedStyle,
    hintAnimatedStyle,
    handleToggleDetail,
    handleFlip: handleToggleDetail, // Alias for backward compatibility
    playTTS,
  };
}

