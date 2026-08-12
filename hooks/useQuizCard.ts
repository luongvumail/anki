import { useState, useEffect, useRef, useCallback } from "react";
import { Animated } from "react-native";
import * as Speech from "expo-speech";
import { QuizQuestion } from "../lib/quizGenerator";
import { triggerHaptic } from "../constants/theme";
import { APP_CONFIG } from "../constants/config";

export type WeakTagType = "pinyin" | "character" | "meaning";

export function useQuizCard(
  question: QuizQuestion,
  onAnswer: (isCorrect: boolean, responseTimeMs: number, weakTag?: WeakTagType) => void,
  isFastRepairMode?: boolean
) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  const startTimeRef = useRef<number>(0);
  const responseTimeMsRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const drawerAnim = useRef(new Animated.Value(300)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const playTTS = useCallback((text: string) => {
    if (!text) return;
    setSpeaking(true);
    Speech.speak(text, {
      language: "zh-CN",
      rate: APP_CONFIG.SPEECH_RATE,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    responseTimeMsRef.current = 0;
    setSelectedIndex(null);
    setIsChecked(false);
    setTimeLeft(5);
    drawerAnim.setValue(300);
    shakeAnim.setValue(0);
    bounceAnim.setValue(1);

    if (timerRef.current) clearInterval(timerRef.current);

    if (isFastRepairMode) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    if (question.type === "listening") {
      playTTS(question.audioText || question.card.character);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, playTTS, drawerAnim, shakeAnim, bounceAnim, isFastRepairMode]);

  useEffect(() => {
    if (isFastRepairMode && timeLeft === 0 && !isChecked) {
      responseTimeMsRef.current = 5000;
      setIsChecked(true);
      triggerHaptic("error");
      Animated.spring(drawerAnim, {
        toValue: 0,
        tension: 65,
        friction: 8,
        useNativeDriver: true,
      }).start();
    }
  }, [isFastRepairMode, timeLeft, isChecked, drawerAnim]);

  const handleSelectOption = useCallback(
    (index: number) => {
      if (isChecked) return;
      triggerHaptic("selection");
      setSelectedIndex(index);
    },
    [isChecked]
  );

  const handleCheck = useCallback(() => {
    if (selectedIndex === null || isChecked) return;

    if (timerRef.current) clearInterval(timerRef.current);

    const elapsed = Date.now() - startTimeRef.current;
    responseTimeMsRef.current = elapsed;

    const chosenOption = question.options[selectedIndex];
    const isCorrect = chosenOption === question.correctAnswer;

    setIsChecked(true);

    if (isCorrect) {
      triggerHaptic("success");
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.05, duration: 150, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    } else {
      triggerHaptic("error");
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }

    Animated.spring(drawerAnim, {
      toValue: 0,
      tension: 65,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [selectedIndex, isChecked, question, bounceAnim, shakeAnim, drawerAnim]);

  const handleContinue = useCallback(() => {
    triggerHaptic("selection");
    let isCorrect = false;

    if (selectedIndex !== null) {
      const chosenOption = question.options[selectedIndex];
      isCorrect = chosenOption === question.correctAnswer;
    }

    let weakTag: WeakTagType | undefined;
    if (!isCorrect) {
      if (question.type === "pinyin_choice") weakTag = "pinyin";
      else if (question.type === "meaning_choice") weakTag = "meaning";
      else weakTag = "character";
    }

    onAnswer(isCorrect, responseTimeMsRef.current, weakTag);
  }, [selectedIndex, question, onAnswer]);

  return {
    selectedIndex,
    isChecked,
    speaking,
    timeLeft,
    drawerAnim,
    shakeAnim,
    bounceAnim,
    playTTS,
    handleSelectOption,
    handleCheck,
    handleContinue,
  };
}
