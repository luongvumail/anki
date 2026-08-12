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
import { Spacing, Radii, Typography, Layout, BorderWidths } from "../../constants/theme";
import { useTheme } from "../../hooks/useTheme";
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
  const { theme } = useTheme();
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
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Fast Repair Mode Countdown Header */}
        {isFastRepairMode && (
          <View style={[styles.timerHeader, { backgroundColor: theme.cardBg, borderColor: theme.yellow }]}>
            <Ionicons name="flash" size={Layout.iconMd} color={theme.yellow} />
            <Text style={[styles.timerTitle, { color: theme.yellow }]}>SỬA LỖI PHẢN XẠ NHANH (5s):</Text>
            <View style={[styles.timerBadge, { backgroundColor: theme.yellowDim }]}>
              <Text style={[styles.timerText, { color: theme.yellow }]}>{timeLeft}s</Text>
            </View>
          </View>
        )}

        {/* Question Prompt Card */}
        <Animated.View
          style={[
            styles.questionCard,
            {
              width: cardWidth,
              backgroundColor: theme.cardBg,
              borderColor: theme.cardBorder,
              borderBottomColor: theme.cardBottom,
            },
            { transform: [{ translateX: shakeAnim }, { scale: bounceAnim }] },
          ]}
        >
          <Text style={[styles.questionPromptText, { color: theme.textMuted }]}>{question.prompt}</Text>

          {/* Target Text (Character or Cloze) */}
          {question.type === "cloze" ? (
            <View style={styles.clozeContainer}>
              <Text style={[styles.clozeSentenceText, { color: theme.textPrimary }]}>
                {question.clozeSentence?.replace("___", " [ ? ] ")}
              </Text>
              {question.clozeTranslation ? (
                <Text style={[styles.clozeTranslationText, { color: theme.textMuted }]}>"{question.clozeTranslation}"</Text>
              ) : null}
            </View>
          ) : question.type === "listening" ? (
            <View style={styles.listeningContainer}>
              <AudioButton
                onPress={() => playTTS(question.audioText || question.card.character)}
                isPlaying={speaking}
                size="lg"
              />
              <Text style={[styles.listeningHintText, { color: theme.textMuted }]}>Bấm nút loa để nghe lại âm thanh</Text>
            </View>
          ) : (
            <View style={styles.targetCharContainer}>
              <Text style={[styles.targetCharText, { color: theme.textPrimary }]}>{question.card.character}</Text>
              {question.type === "pinyin_choice" ? (
                <Text style={[styles.targetSubText, { color: getPinyinToneColor(question.card.pinyin) }]}>
                  {question.card.pinyin}
                </Text>
              ) : null}
            </View>
          )}
        </Animated.View>

        {/* Multiple Choice Options Grid */}
        <View style={[styles.optionsGrid, { width: cardWidth }]}>
          {question.options.map((opt, idx) => {
            const isSelected = selectedIndex === idx;
            let cardBg = theme.cardBg;
            let cardBorder = theme.cardBorder;
            let cardBottom = theme.cardBottom;
            let letterBg = theme.bgSoft;
            let letterColor = theme.textMuted;

            if (isSelected) {
              cardBg = theme.blueDim;
              cardBorder = theme.blue;
              cardBottom = theme.blueDark;
              letterBg = theme.blue;
              letterColor = "#FFFFFF";
            }

            if (isChecked) {
              if (opt === question.correctAnswer) {
                cardBg = theme.greenDim;
                cardBorder = theme.green;
                cardBottom = theme.greenDark;
                letterBg = theme.green;
                letterColor = "#FFFFFF";
              } else if (isSelected && !isCorrect) {
                cardBg = theme.redDim;
                cardBorder = theme.red;
                cardBottom = theme.redDark;
                letterBg = theme.red;
                letterColor = "#FFFFFF";
              }
            }

            return (
              <TouchableOpacity
                key={idx}
                activeOpacity={0.8}
                disabled={isChecked}
                onPress={() => handleSelectOption(idx)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: cardBg,
                    borderColor: cardBorder,
                    borderBottomColor: cardBottom,
                  },
                ]}
              >
                <View style={[styles.letterBox, { backgroundColor: letterBg }]}>
                  <Text style={[styles.letterText, { color: letterColor }]}>{OPTION_LETTERS[idx]}</Text>
                </View>

                <Text style={[styles.optionText, { color: theme.textPrimary }]} numberOfLines={2}>
                  {opt}
                </Text>

                {isChecked && opt === question.correctAnswer && (
                  <Ionicons name="checkmark-circle" size={Layout.iconLg} color={theme.green} />
                )}
                {isChecked && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={Layout.iconLg} color={theme.red} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Primary Action Button (CHECK) */}
      {!isChecked && (
        <View style={styles.checkBtnWrapper}>
          <DuolingoButton
            title="KIỂM TRA"
            variant="primary"
            size="lg"
            disabled={selectedIndex === null}
            onPress={handleCheck}
          />
        </View>
      )}

      {/* Bottom Drawer Result Result (CORRECT / INCORRECT) */}
      {isChecked && (
        <Animated.View
          style={[
            styles.resultDrawer,
            {
              backgroundColor: isCorrect ? theme.greenDim : theme.redDim,
              borderColor: isCorrect ? theme.green : theme.red,
              transform: [{ translateY: drawerAnim }],
            },
          ]}
        >
          <View style={styles.resultHeaderRow}>
            <View style={styles.resultIconWrap}>
              <Ionicons
                name={isCorrect ? "checkmark-circle" : "close-circle"}
                size={Layout.iconXl}
                color={isCorrect ? theme.green : theme.red}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.resultTitleText,
                  { color: isCorrect ? theme.green : theme.red },
                ]}
              >
                {isCorrect ? "CHÍNH XÁC! XUẤT SẮC!" : "RẤT TIẾC, CHƯA ĐÚNG!"}
              </Text>
              {!isCorrect && (
                <Text style={[styles.correctAnswerLabelText, { color: theme.textMuted }]}>
                  Đáp án đúng: <Text style={{ fontWeight: "800", color: theme.textPrimary }}>{question.correctAnswer}</Text>
                </Text>
              )}
            </View>
          </View>

          <DuolingoButton
            title="TIẾP THEO"
            variant={isCorrect ? "primary" : "error"}
            size="lg"
            onPress={handleContinue}
            style={{ marginTop: Spacing.md }}
          />
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.pageMargin,
    paddingTop: Spacing.md,
    paddingBottom: 110,
    alignItems: "center",
  },
  timerHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.cellPadding,
    paddingVertical: Spacing.xs,
    borderRadius: Radii.full,
    borderWidth: BorderWidths.default,
    marginBottom: Spacing.cellPadding,
  },
  timerTitle: {
    fontSize: Typography.caption1.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  timerBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs / 2,
    borderRadius: Radii.sm,
  },
  timerText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  questionCard: {
    borderRadius: Radii.xl,
    borderWidth: BorderWidths.default,
    borderBottomWidth: BorderWidths.card3D,
    padding: Spacing.xl,
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  questionPromptText: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.extraBold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  targetCharContainer: {
    alignItems: "center",
    marginTop: Spacing.cellPadding,
  },
  targetCharText: {
    fontSize: Typography.hanziCard?.fontSize || 48,
    fontWeight: Typography.weight.extraBold,
  },
  targetSubText: {
    fontSize: Typography.titleMD.fontSize,
    fontWeight: Typography.weight.bold,
    marginTop: Spacing.xs,
  },
  listeningContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.cellPadding,
  },
  listeningHintText: {
    fontSize: Typography.caption.fontSize,
    fontWeight: Typography.weight.semibold,
  },
  clozeContainer: {
    alignItems: "center",
    marginTop: Spacing.lg,
  },
  clozeSentenceText: {
    fontSize: Typography.titleLG.fontSize,
    fontWeight: Typography.weight.extraBold,
    textAlign: "center",
    lineHeight: 30,
  },
  clozeTranslationText: {
    fontSize: Typography.subhead.fontSize,
    marginTop: Spacing.sm,
    fontWeight: Typography.weight.semibold,
    textAlign: "center",
  },
  optionsGrid: {
    gap: Spacing.cellPadding,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radii.lg,
    borderWidth: BorderWidths.default,
    borderBottomWidth: BorderWidths.card3D,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  letterBox: {
    width: Layout.avatarSm,
    height: Layout.avatarSm,
    borderRadius: Radii.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: Typography.subhead.fontSize,
    fontWeight: Typography.weight.extraBold,
    color: "#FFFFFF",
  },
  optionText: {
    fontSize: Typography.bodyMD.fontSize,
    fontWeight: Typography.weight.bold,
    flex: 1,
  },
  checkBtnWrapper: {
    position: "absolute",
    bottom: Spacing.lg,
    left: Spacing.pageMargin,
    right: Spacing.pageMargin,
  },
  resultDrawer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: BorderWidths.default,
    borderLeftWidth: BorderWidths.default,
    borderRightWidth: BorderWidths.default,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  resultHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.cellPadding,
  },
  resultIconWrap: {
    width: Layout.avatarMd,
    height: Layout.avatarMd,
    alignItems: "center",
    justifyContent: "center",
  },
  resultTitleText: {
    fontSize: Typography.titleMD.fontSize,
    fontWeight: Typography.weight.extraBold,
  },
  correctAnswerLabelText: {
    fontSize: Typography.caption.fontSize,
    marginTop: 2,
  },
});
