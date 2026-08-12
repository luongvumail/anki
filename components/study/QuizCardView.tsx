import React from "react";
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
import { QuizQuestion } from "../../lib/quizGenerator";
import { Colors, Spacing, Radii } from "../../constants/theme";
import { DuolingoButton } from "../ui/DuolingoButton";
import { AudioButton } from "../ui/AudioButton";
import { getPinyinToneColor } from "../../lib/pinyinColor";
import { useQuizCard, WeakTagType } from "../../hooks/useQuizCard";

export { WeakTagType };

interface QuizCardViewProps {
  question: QuizQuestion;
  onAnswer: (isCorrect: boolean, responseTimeMs: number, weakTag?: WeakTagType) => void;
  isFastRepairMode?: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D"];

export function QuizCardView({ question, onAnswer, isFastRepairMode }: QuizCardViewProps) {
  const { width } = useWindowDimensions();
  const cardWidth = width - Spacing.pageMargin * 2;

  const {
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
  } = useQuizCard(question, onAnswer, isFastRepairMode);

  const chosenOption = selectedIndex !== null ? question.options[selectedIndex] : null;
  const isCorrect = chosenOption === question.correctAnswer;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Fast Repair Mode Countdown Header */}
        {isFastRepairMode && (
          <View style={styles.timerHeader}>
            <Ionicons name="flash" size={18} color={Colors.duolingo.yellow} />
            <Text style={styles.timerTitle}>SỬA LỖI PHẢN XẠ NHANH (5s):</Text>
            <View style={styles.timerBadge}>
              <Text style={styles.timerText}>{timeLeft}s</Text>
            </View>
          </View>
        )}

        {/* Question Prompt Card */}
        <Animated.View
          style={[
            styles.questionCard,
            { width: cardWidth },
            { transform: [{ translateX: shakeAnim }, { scale: bounceAnim }] },
          ]}
        >
          <Text style={styles.questionPromptText}>{question.prompt}</Text>

          {/* Target Text (Character or Cloze) */}
          {question.type === "cloze" ? (
            <View style={styles.clozeContainer}>
              <Text style={styles.clozeSentenceText}>
                {question.clozeSentence?.replace("___", " [ ? ] ")}
              </Text>
              {question.clozeTranslation ? (
                <Text style={styles.clozeTranslationText}>"{question.clozeTranslation}"</Text>
              ) : null}
            </View>
          ) : question.type === "listening" ? (
            <View style={styles.listeningContainer}>
              <AudioButton
                onPress={() => playTTS(question.audioText || question.card.character)}
                isPlaying={speaking}
                size="lg"
              />
              <Text style={styles.listeningHintText}>Bấm nút loa để nghe lại âm thanh</Text>
            </View>
          ) : (
            <View style={styles.targetCharContainer}>
              <Text style={styles.targetCharText}>{question.targetText || question.card.character}</Text>
              {question.subText ? (
                <Text
                  style={[
                    styles.targetSubText,
                    { color: getPinyinToneColor(question.subText) },
                  ]}
                >
                  {question.subText}
                </Text>
              ) : null}
            </View>
          )}
        </Animated.View>

        {/* 4 Multiple Choice Option Cards */}
        <View style={[styles.optionsGrid, { width: cardWidth }]}>
          {question.options.map((option, idx) => {
            const isSelected = selectedIndex === idx;
            const isRight = option === question.correctAnswer;

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                style={[
                  styles.optionCard,
                  isSelected && styles.optionCardSelected,
                  isChecked && isRight && styles.optionCardCorrect,
                  isChecked && isSelected && !isRight && styles.optionCardWrong,
                ]}
                onPress={() => handleSelectOption(idx)}
                disabled={isChecked}
              >
                <View
                  style={[
                    styles.letterBox,
                    isSelected && styles.letterBoxSelected,
                    isChecked && isRight && styles.letterBoxCorrect,
                    isChecked && isSelected && !isRight && styles.letterBoxWrong,
                  ]}
                >
                  <Text style={styles.letterText}>{OPTION_LETTERS[idx]}</Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    isChecked && isRight && styles.optionTextCorrect,
                    isChecked && isSelected && !isRight && styles.optionTextWrong,
                  ]}
                  numberOfLines={2}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Check Action Button */}
      {!isChecked && (
        <View style={styles.footerActionBox}>
          <DuolingoButton
            title="KIỂM TRA"
            variant="primary"
            size="lg"
            disabled={selectedIndex === null}
            onPress={handleCheck}
            style={{ width: "100%" }}
          />
        </View>
      )}

      {/* Result Bottom Drawer Panel */}
      {isChecked && (
        <Animated.View
          style={[
            styles.resultDrawer,
            isCorrect ? styles.resultDrawerCorrect : styles.resultDrawerWrong,
            { transform: [{ translateY: drawerAnim }] },
          ]}
        >
          <View style={styles.resultHeaderRow}>
            <View style={styles.resultIconWrap}>
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={36}
                color={isCorrect ? Colors.duolingo.green : Colors.duolingo.red}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.resultTitleText,
                  { color: isCorrect ? Colors.duolingo.green : Colors.duolingo.red },
                ]}
              >
                {isCorrect ? "CHÍNH XÁC!" : "CHƯA ĐÚNG RỒI!"}
              </Text>
              {!isCorrect && (
                <Text style={styles.correctAnswerLabelText}>
                  Đáp án đúng: <Text style={{ fontWeight: "900", color: "#FFFFFF" }}>{question.correctAnswer}</Text>
                </Text>
              )}
            </View>

            <AudioButton onPress={() => playTTS(question.card.character)} size="sm" />
          </View>

          <DuolingoButton
            title="TIẾP TỤC"
            variant={isCorrect ? "primary" : "secondary"}
            size="lg"
            onPress={handleContinue}
            style={{ width: "100%", marginTop: 12 }}
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
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: Spacing.md,
    paddingBottom: 100,
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.duolingo.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radii.full,
    borderWidth: 2,
    borderColor: Colors.duolingo.yellow,
    marginBottom: 14,
  },
  timerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.duolingo.yellow,
  },
  timerBadge: {
    backgroundColor: Colors.duolingo.yellowDim,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.sm,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "900",
    color: Colors.duolingo.yellow,
  },
  questionCard: {
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.xl,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  questionPromptText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  targetCharContainer: {
    alignItems: "center",
    marginTop: 14,
  },
  targetCharText: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.text.white,
  },
  targetSubText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  listeningContainer: {
    alignItems: "center",
    marginTop: 20,
    gap: 10,
  },
  listeningHintText: {
    fontSize: 12,
    color: Colors.duolingo.textMuted,
    fontWeight: "600",
  },
  clozeContainer: {
    alignItems: "center",
    marginTop: 16,
  },
  clozeSentenceText: {
    fontSize: 22,
    fontWeight: "800",
    color: Colors.text.white,
    textAlign: "center",
    lineHeight: 30,
  },
  clozeTranslationText: {
    fontSize: 14,
    color: Colors.duolingo.textMuted,
    marginTop: 8,
    fontWeight: "600",
    textAlign: "center",
  },
  optionsGrid: {
    gap: 10,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.duolingo.cardBg,
    borderRadius: Radii.lg,
    borderWidth: 2,
    borderColor: Colors.duolingo.cardBorder,
    padding: Spacing.md,
    gap: 12,
  },
  optionCardSelected: {
    borderColor: Colors.duolingo.blue,
    backgroundColor: Colors.duolingo.bgSoftDark,
  },
  optionCardCorrect: {
    borderColor: Colors.duolingo.green,
    backgroundColor: "rgba(88, 204, 2, 0.15)",
  },
  optionCardWrong: {
    borderColor: Colors.duolingo.red,
    backgroundColor: "rgba(255, 75, 75, 0.15)",
  },
  letterBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.duolingo.cardBottom,
    alignItems: "center",
    justifyContent: "center",
  },
  letterBoxSelected: {
    backgroundColor: Colors.duolingo.blue,
  },
  letterBoxCorrect: {
    backgroundColor: Colors.duolingo.green,
  },
  letterBoxWrong: {
    backgroundColor: Colors.duolingo.red,
  },
  letterText: {
    fontSize: 14,
    fontWeight: "900",
    color: "#FFFFFF",
  },
  optionText: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text.white,
    flex: 1,
  },
  optionTextCorrect: {
    color: Colors.duolingo.green,
  },
  optionTextWrong: {
    color: Colors.duolingo.red,
  },
  footerActionBox: {
    position: "absolute",
    bottom: 20,
    left: Spacing.pageMargin,
    right: Spacing.pageMargin,
  },
  resultDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.duolingo.cardBg,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    padding: Spacing.md,
    paddingBottom: 24,
  },
  resultDrawerCorrect: {
    borderColor: Colors.duolingo.green,
  },
  resultDrawerWrong: {
    borderColor: Colors.duolingo.red,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  resultIconWrap: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitleText: {
    fontSize: 18,
    fontWeight: "900",
  },
  correctAnswerLabelText: {
    fontSize: 13,
    color: Colors.duolingo.textMuted,
    marginTop: 2,
  },
});
