import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  useWindowDimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import { QuizQuestion } from "../../lib/quizGenerator";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { AudioButton } from "../ui/AudioButton";

export type WeakTagType = "pinyin" | "character" | "meaning";

interface QuizCardViewProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean, responseTimeMs: number, weakTag?: WeakTagType) => void;
  isFastRepairMode?: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function QuizCardView({ question, onAnswer, isFastRepairMode }: QuizCardViewProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - Spacing.pageMargin * 2;

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);

  const startTimeRef = useRef<number>(0);
  const responseTimeMsRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animation Refs
  const drawerAnim = useRef(new Animated.Value(300)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const bounceAnim = useRef(new Animated.Value(1)).current;

  const playTTS = useCallback((text: string) => {
    if (!text) return;
    setSpeaking(true);
    Speech.speak(text, {
      language: "zh-CN",
      rate: 0.8,
      onDone: () => setSpeaking(false),
      onError: () => setSpeaking(false),
    });
  }, []);

  useEffect(() => {
    // Reset timer & timing on new question
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
            // Auto timeout trigger
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Auto play audio if listening question
    if (question.type === "listening") {
      playTTS(question.audioText || question.card.character);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [question, playTTS, drawerAnim, shakeAnim, bounceAnim, isFastRepairMode]);

  // Handle timeout in fast repair mode
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
  }, [timeLeft, isFastRepairMode, isChecked, drawerAnim]);

  const handleSelectOption = (index: number) => {
    if (isChecked) return;
    setSelectedIndex(index);
  };

  const handleCheck = () => {
    if (selectedIndex === null || isChecked) return;
    if (timerRef.current) clearInterval(timerRef.current);

    responseTimeMsRef.current = Date.now() - startTimeRef.current;
    const selectedOption = question.options[selectedIndex];
    const isCorrect = selectedOption === question.correctAnswer;

    setIsChecked(true);

    if (isCorrect) {
      triggerHaptic("success");
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: 1.08, duration: 100, useNativeDriver: true }),
        Animated.spring(bounceAnim, {
          toValue: 1,
          friction: 4,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      triggerHaptic("error");
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: -10, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 10, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -6, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 6, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 45, useNativeDriver: true }),
      ]).start();
    }

    // Slide up bottom result sheet
    Animated.spring(drawerAnim, {
      toValue: 0,
      tension: 65,
      friction: 8,
      useNativeDriver: true,
    }).start();
  };

  const handleContinue = () => {
    const selectedOption = selectedIndex !== null ? question.options[selectedIndex] : null;
    const isCorrect = selectedOption === question.correctAnswer;

    let weakTag: WeakTagType = "meaning";
    if (question.type === "pinyin_choice") weakTag = "pinyin";
    else if (question.type === "listening" || question.type === "cloze") weakTag = "character";

    onAnswer(isCorrect, responseTimeMsRef.current || 4000, weakTag);
  };

  const selectedOption = selectedIndex !== null ? question.options[selectedIndex] : null;
  const isCorrect = selectedOption === question.correctAnswer;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Prompt Speech Bubble */}
        <Animated.View
          style={[
            styles.speechCard,
            {
              width: cardWidth,
              transform: [{ translateX: shakeAnim }, { scale: bounceAnim }],
            },
          ]}
        >
          {/* Badge indicator */}
          <View style={styles.badgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {question.type === "meaning_choice"
                  ? "BÀI TẬP CHỌN NGHĨA"
                  : question.type === "listening"
                    ? "BÀI TẬP ÂM THANH"
                    : question.type === "cloze"
                      ? "ĐIỀN VÀO CHỖ TRỐNG"
                      : "TRẮC NGHIỆM PINYIN"}
              </Text>
            </View>

            {isFastRepairMode && (
              <View style={[styles.typeBadge, { backgroundColor: Colors.duolingo.yellow }]}>
                <Ionicons name="flash" size={12} color="#000000" />
                <Text style={[styles.typeBadgeText, { color: "#000000", fontWeight: "900" }]}>
                  CẮM CỜ NGUY CƠ: {timeLeft}s
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.promptText}>{question.prompt}</Text>

          {/* Question Body */}
          {(question.type === "pinyin_choice" || question.type === "meaning_choice") && (
            <View style={styles.centerTargetBox}>
              <Text style={styles.characterBig}>
                {question.targetText || question.card.character}
              </Text>
              {question.subText ? (
                <Text
                  style={[
                    styles.subTextHint,
                    {
                      color:
                        question.type === "meaning_choice"
                          ? Colors.duolingo.blue
                          : Colors.duolingo.green,
                    },
                  ]}
                >
                  {question.subText}
                </Text>
              ) : null}
              <AudioButton
                onPress={() => playTTS(question.card.character)}
                isPlaying={speaking}
                size="md"
                style={{ marginTop: 6 }}
              />
            </View>
          )}

          {question.type === "listening" && (
            <View style={styles.audioTargetBox}>
              <AudioButton
                onPress={() => playTTS(question.audioText || question.card.character)}
                isPlaying={speaking}
                size="lg"
              />
              {question.subText ? (
                <Text style={[styles.subTextHint, { color: Colors.duolingo.green, marginTop: 10 }]}>
                  {question.subText}
                </Text>
              ) : null}
            </View>
          )}

          {question.type === "cloze" && (
            <View style={styles.clozeTargetBox}>
              <Text style={styles.clozeSentenceText}>{question.clozeSentence}</Text>
              {question.clozeTranslation ? (
                <Text style={styles.clozeTranslationText}>"{question.clozeTranslation}"</Text>
              ) : null}
            </View>
          )}
        </Animated.View>

        {/* 3D Tactile Option Cards List */}
        <View style={[styles.optionsList, { width: cardWidth }]}>
          {question.options.map((option, index) => {
            const isSelected = selectedIndex === index;
            const letter = OPTION_LETTERS[index] || `${index + 1}`;

            let tileStyle = styles.optionTileDefault;
            let badgeStyle = styles.letterBadgeDefault;
            let badgeTextStyle = styles.letterTextDefault;

            if (isSelected) {
              tileStyle = styles.optionTileSelected;
              badgeStyle = styles.letterBadgeSelected;
              badgeTextStyle = styles.letterTextSelected;
            }

            if (isChecked) {
              if (option === question.correctAnswer) {
                tileStyle = styles.optionTileCorrect;
                badgeStyle = styles.letterBadgeCorrect;
                badgeTextStyle = styles.letterTextCorrect;
              } else if (isSelected && !isCorrect) {
                tileStyle = styles.optionTileWrong;
                badgeStyle = styles.letterBadgeWrong;
                badgeTextStyle = styles.letterTextWrong;
              }
            }

            return (
              <TouchableOpacity
                key={`${option}-${index}`}
                activeOpacity={0.85}
                disabled={isChecked}
                onPress={() => handleSelectOption(index)}
                style={[styles.optionTileBase, tileStyle]}
              >
                {/* 3D Letter Badge A, B, C, D */}
                <View style={[styles.letterBadgeBase, badgeStyle]}>
                  <Text style={[styles.letterTextBase, badgeTextStyle]}>{letter}</Text>
                </View>

                {/* Option Text Content */}
                <Text
                  style={[
                    styles.optionText,
                    isSelected && { color: "#FFFFFF" },
                    isChecked && option === question.correctAnswer && { color: "#FFFFFF" },
                  ]}
                  numberOfLines={2}
                >
                  {option}
                </Text>

                {/* Status Indicator Icon */}
                {isChecked && option === question.correctAnswer && (
                  <Ionicons
                    name="checkmark-circle"
                    size={24}
                    color="#FFFFFF"
                    style={{ marginLeft: "auto" }}
                  />
                )}
                {isChecked && isSelected && !isCorrect && (
                  <Ionicons
                    name="close-circle"
                    size={24}
                    color="#FFFFFF"
                    style={{ marginLeft: "auto" }}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Check Action Bar */}
      {!isChecked && (
        <View style={styles.bottomBar}>
          <DuolingoButton
            title="KIỂM TRA"
            variant="primary"
            size="lg"
            disabled={selectedIndex === null}
            onPress={handleCheck}
          />
        </View>
      )}

      {/* Instant Feedback Result Sheet */}
      {isChecked && (
        <Animated.View
          style={[
            styles.resultDrawer,
            isCorrect ? styles.resultDrawerCorrect : styles.resultDrawerWrong,
            { transform: [{ translateY: drawerAnim }] },
          ]}
        >
          <View style={styles.resultHeader}>
            <View style={styles.resultTitleRow}>
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={26}
                color={isCorrect ? Colors.duolingo.green : Colors.duolingo.red}
              />
              <Text
                style={[
                  styles.resultTitleText,
                  { color: isCorrect ? Colors.duolingo.green : Colors.duolingo.red },
                ]}
              >
                {isCorrect ? "Chính xác!" : "Đáp án đúng:"}
              </Text>
            </View>

            {/* Unified Answer Explanation: Character + Pinyin + Translation */}
            <View style={styles.answerExplainBox}>
              <Text style={styles.explainChar}>
                {question.card.character}
                {question.card.pinyin ? ` · ${question.card.pinyin}` : ""}
              </Text>
              {question.card.translation ? (
                <Text style={styles.explainTrans}>{question.card.translation}</Text>
              ) : null}
            </View>
          </View>

          <DuolingoButton
            title={isCorrect ? "TIẾP TỤC" : "ĐÃ HIỂU"}
            variant={isCorrect ? "primary" : "error"}
            size="lg"
            onPress={handleContinue}
            style={{ marginTop: Spacing.sm }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
    position: "relative",
  },
  scrollContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
    paddingBottom: 110,
    alignItems: "center",
  },

  speechCard: {
    backgroundColor: Colors.duolingo.bgSoftDark,
    borderRadius: Radii.xl,
    padding: Spacing.space4,
    borderWidth: 0,
    borderBottomWidth: 4,
    borderBottomColor: "#18242B",
    marginBottom: Spacing.space6,
  },
  badgeRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(28, 176, 246, 0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },

  promptText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 26,
    marginBottom: Spacing.md,
  },

  centerTargetBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    backgroundColor: "#131F24",
    borderRadius: Radii.lg,
  },
  characterBig: {
    fontSize: 48,
    fontWeight: "800",
    color: Colors.text.white,
    marginBottom: 4,
  },
  subTextHint: {
    fontSize: 16,
    fontWeight: "800",
    marginTop: 2,
    marginBottom: 6,
    textAlign: "center",
  },
  speakBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(28, 176, 246, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  speakBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  audioTargetBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
  },
  bigAudioBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.duolingo.blue,
    borderBottomWidth: 5,
    borderBottomColor: Colors.duolingo.blueDark,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  audioHintText: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    fontWeight: "600",
  },

  clozeTargetBox: {
    backgroundColor: "#131F24",
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  clozeSentenceText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 30,
  },
  clozeTranslationText: {
    fontSize: 14,
    color: Colors.duolingo.textMuted,
    marginTop: 6,
    fontStyle: "italic",
  },

  optionsList: {
    gap: 12,
  },

  optionTileBase: {
    width: "100%",
    borderRadius: Radii.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 60,
  },
  optionTileDefault: {
    backgroundColor: Colors.duolingo.bgSoftDark,
    borderWidth: 0,
    borderBottomWidth: 4,
    borderBottomColor: "#18242B",
  },
  optionTileSelected: {
    backgroundColor: "#1D3545",
    borderWidth: 0,
    borderBottomWidth: 4,
    borderBottomColor: Colors.duolingo.blueDark,
  },
  optionTileCorrect: {
    backgroundColor: Colors.duolingo.green,
    borderWidth: 0,
    borderBottomWidth: 4,
    borderBottomColor: Colors.duolingo.greenDark,
  },
  optionTileWrong: {
    backgroundColor: Colors.duolingo.red,
    borderWidth: 0,
    borderBottomWidth: 4,
    borderBottomColor: Colors.duolingo.redDark,
  },

  letterBadgeBase: {
    width: 32,
    height: 32,
    borderRadius: Radii.md,
    alignItems: "center",
    justifyContent: "center",
  },
  letterBadgeDefault: {
    backgroundColor: "#131F24",
    borderBottomWidth: 2,
    borderBottomColor: "#0D1518",
  },
  letterBadgeSelected: {
    backgroundColor: Colors.duolingo.blue,
    borderBottomWidth: 2,
    borderBottomColor: Colors.duolingo.blueDark,
  },
  letterBadgeCorrect: {
    backgroundColor: Colors.duolingo.greenDark,
    borderBottomWidth: 2,
    borderBottomColor: "#3B7200",
  },
  letterBadgeWrong: {
    backgroundColor: Colors.duolingo.redDark,
    borderBottomWidth: 2,
    borderBottomColor: "#A81E1E",
  },

  letterTextBase: {
    fontSize: 15,
    fontWeight: "800",
  },
  letterTextDefault: {
    color: Colors.duolingo.textMuted,
  },
  letterTextSelected: {
    color: "#FFFFFF",
  },
  letterTextCorrect: {
    color: "#FFFFFF",
  },
  letterTextWrong: {
    color: "#FFFFFF",
  },

  optionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },

  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.duolingo.bg,
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.xs,
  },

  resultDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
    paddingBottom: Math.max(Spacing.lg, 24),
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 2,
  },
  resultDrawerCorrect: {
    backgroundColor: "#193318",
    borderTopColor: Colors.duolingo.greenDark,
  },
  resultDrawerWrong: {
    backgroundColor: "#381616",
    borderTopColor: Colors.duolingo.redDark,
  },
  resultHeader: {
    marginBottom: Spacing.xs,
  },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  resultTitleText: {
    fontSize: 22,
    fontWeight: "800",
  },
  answerExplainBox: {
    marginTop: 4,
  },
  explainChar: {
    fontSize: 20,
    fontWeight: "800",
    color: Colors.text.white,
  },
  explainTrans: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.duolingo.green,
    marginTop: 2,
  },
});
