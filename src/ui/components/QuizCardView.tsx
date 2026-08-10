import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { QuizQuestion } from "../../application/usecases/GenerateQuiz.js";
import { theme } from "../theme/theme.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";

export interface QuizCardViewProps {
  question: QuizQuestion;
  onAnswer: (selectedOption: string, elapsedMs: number) => void;
}

export const QuizCardView: React.FC<QuizCardViewProps> = ({ question, onAnswer }) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [startTime] = useState<number>(() => Date.now());
  const [timerSeconds, setTimerSeconds] = useState<number>(0);
  const [feedbackInfo, setFeedbackInfo] = useState<{
    isCorrect: boolean;
    ratingText: string;
  } | null>(null);

  // Live timer tick
  useEffect(() => {
    if (selectedOption !== null) return;
    const interval = setInterval(() => {
      setTimerSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, selectedOption]);

  const handleSelect = (option: string) => {
    if (selectedOption !== null) return;
    const elapsedMs = Date.now() - startTime;
    setSelectedOption(option);

    const isCorrect = option === question.correctAnswer;
    let ratingText = "QUÊN";
    if (isCorrect) {
      ratingText = elapsedMs < 3000 ? "DỄ (Phản xạ <3s)" : "TỐT (Phản xạ >=3s)";
    }
    setFeedbackInfo({ isCorrect, ratingText });

    setTimeout(() => {
      onAnswer(option, elapsedMs);
      setSelectedOption(null);
      setFeedbackInfo(null);
    }, 1200);
  };

  const getQuestionLabel = () => {
    switch (question.type) {
      case "FILL_IN_BLANK":
        return "ĐIỀN TỪ HÁN TỰ ĐÚNG VÀO CHỖ TRỐNG CÂU VÍ DỤ";
      case "KANJI_TO_MEANING":
        return "CHỌN NGHĨA TIẾNG VIỆT ĐÚNG CỦA HÁN TỰ";
      case "KANJI_TO_PINYIN":
        return "CHỌN PINYIN PHIÊN ÂM CHUẨN XÁC";
      case "AUDIO_TO_KANJI":
        return "CHỌN HÁN TỰ TƯƠNG ỨNG VỚI PINYIN";
      default:
        return "CHỌN ĐÁP ÁN ĐÚNG";
    }
  };

  return (
    <View style={styles.container}>
      <DuolingoCard accessibilityLabel={`Câu hỏi: ${question.questionText}`}>
        <View style={styles.cardHeader}>
          <Text style={styles.promptText}>{getQuestionLabel()}</Text>
          <View style={styles.timerBadge}>
            <Icon name="timer" size={16} color={theme.colors.secondary} />
            <Text style={styles.timerText}>{timerSeconds}s</Text>
          </View>
        </View>

        <Text
          style={[styles.questionText, question.type === "FILL_IN_BLANK" && styles.fillInBlankText]}
        >
          {question.questionText}
        </Text>
      </DuolingoCard>

      {/* Dynamic Feedback Banner */}
      {feedbackInfo && (
        <View
          style={[
            styles.feedbackBanner,
            {
              backgroundColor: feedbackInfo.isCorrect
                ? theme.badges.learned.bg
                : theme.badges.due.bg,
              borderColor: feedbackInfo.isCorrect ? theme.colors.primary : theme.colors.danger,
            },
          ]}
        >
          <Icon
            name={feedbackInfo.isCorrect ? "check" : "wrench"}
            color={feedbackInfo.isCorrect ? theme.colors.primary : theme.colors.danger}
          />
          <Text
            style={[
              styles.feedbackText,
              {
                color: feedbackInfo.isCorrect ? theme.colors.primary : theme.colors.danger,
              },
            ]}
          >
            {feedbackInfo.isCorrect
              ? `Chính xác! Đánh giá FSRS v5: ${feedbackInfo.ratingText}`
              : `Chưa đúng! FSRS v5: QUÊN (Ghi nhận vào danh sách sửa lỗi)`}
          </Text>
        </View>
      )}

      {/* 2x2 Options Grid */}
      <View style={styles.grid}>
        {question.options.map((option, idx) => {
          const isSelected = selectedOption === option;
          const isCorrect = option === question.correctAnswer;
          const showFeedback = selectedOption !== null;

          let bg = theme.colors.white;
          let border = theme.colors.cardBorder;
          let text = theme.colors.textPrimary;

          if (showFeedback) {
            if (isSelected) {
              if (isCorrect) {
                bg = theme.badges.learned.bg;
                border = theme.colors.primary;
                text = theme.colors.primary;
              } else {
                bg = theme.badges.due.bg;
                border = theme.colors.danger;
                text = theme.colors.danger;
              }
            } else if (isCorrect) {
              bg = theme.badges.learned.bg;
              border = theme.colors.primary;
              text = theme.colors.primary;
            }
          }

          return (
            <Pressable
              key={idx}
              onPress={() => handleSelect(option)}
              disabled={selectedOption !== null}
              style={[
                styles.optionBtn,
                {
                  backgroundColor: bg,
                  borderColor: border,
                  borderBottomColor: border,
                },
              ]}
            >
              {showFeedback && isCorrect && <Icon name="check" color={theme.colors.primary} />}
              <Text style={[styles.optionText, { color: text }]}>{option}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.xs,
  },
  promptText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: theme.badges.warning.bg,
    borderColor: theme.badges.warning.border,
    borderWidth: 1,
    paddingVertical: 2,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.sm,
  },
  timerText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.secondary,
  },
  questionText: {
    fontSize: theme.fontSize.title,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.textPrimary,
    marginVertical: theme.spacing.md,
    textAlign: "center",
  },
  fillInBlankText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.primary,
    fontStyle: "italic",
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 2,
    marginBottom: theme.spacing.md,
  },
  feedbackText: {
    fontSize: theme.fontSize.xs,
    fontWeight: theme.fontWeight.bold,
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  optionBtn: {
    width: "47%",
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 2,
    borderBottomWidth: 4,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: theme.spacing.xs,
    minHeight: 80,
  },
  optionText: {
    fontSize: theme.fontSize.base,
    fontWeight: theme.fontWeight.bold,
    textAlign: "center",
  },
});
