import React, { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Speech from "expo-speech";
import { CardEntity } from "../../domain/card/cardEntity.js";
import { evaluateSpeaking, SpeakingFeedback } from "../../infrastructure/ai/speakingService.js";
import { container } from "../../infrastructure/container.js";
import { useTheme } from "../theme/ThemeContext.js";
import { DuolingoButton } from "./DuolingoButton.js";
import { DuolingoCard } from "./DuolingoCard.js";
import { Icon } from "./Icon.js";
import { ProgressBar } from "./ProgressBar.js";

export interface SpeakingGameProps {
  deckId: string;
  onFinish: (score: number) => void;
}

export const SpeakingGame: React.FC<SpeakingGameProps> = ({ deckId, onFinish }) => {
  const { theme } = useTheme();
  const [cards, setCards] = useState<CardEntity[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<SpeakingFeedback | null>(null);
  const [totalScore, setTotalScore] = useState<number>(0);
  const [isDone, setIsDone] = useState<boolean>(false);
  const [isLoadingCards, setIsLoadingCards] = useState<boolean>(true);

  useEffect(() => {
    setIsLoadingCards(true);
    container.cardRepo.getByDeckId(deckId).then((fetched) => {
      setCards(fetched);
      setIsLoadingCards(false);
    });
  }, [deckId]);

  const currentCard = cards[currentIndex];

  const handlePlayAudio = () => {
    if (!currentCard) return;
    Speech.speak(currentCard.kanji, { language: "zh-CN", rate: 0.85 });
  };

  const handleStartRecord = async () => {
    if (!currentCard || isRecording || isEvaluating) return;
    setIsRecording(true);
    setFeedback(null);

    // Simulate listening for 2 seconds then evaluate
    setTimeout(async () => {
      setIsRecording(false);
      setIsEvaluating(true);

      const result = await evaluateSpeaking(
        currentCard.kanji,
        currentCard.pinyin,
        currentCard.kanji,
      );

      setFeedback(result);
      setTotalScore((prev) => prev + Math.round(result.score / 10));
      setIsEvaluating(false);
    }, 2200);
  };

  const handleNext = () => {
    setFeedback(null);
    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsDone(true);
    }
  };

  if (isLoadingCards) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
          Đang tải dữ liệu từ vựng...
        </Text>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <DuolingoCard accessibilityLabel="Không đủ từ vựng">
          <Text style={[styles.infoText, { color: theme.colors.textPrimary }]}>
            Bộ thẻ này chưa có từ vựng. Vui lòng thêm từ vựng trước khi luyện nói AI!
          </Text>
          <View style={{ marginTop: 16 }}>
            <DuolingoButton
              title="QUAY LẠI"
              variant="primary"
              onPress={() => onFinish(0)}
            />
          </View>
        </DuolingoCard>
      </View>
    );
  }

  if (isDone) {
    return (
      <View style={[styles.container, styles.center]}>
        <DuolingoCard accessibilityLabel="Kết quả luyện phát âm AI">
          <View style={styles.doneBox}>
            <Icon name="sparkles" size={56} color={theme.colors.primary} />
            <Text style={[styles.doneTitle, { color: theme.colors.textPrimary }]}>
              HOÀN THÀNH LUYỆN NÓI AI!
            </Text>
            <Text style={[styles.doneScore, { color: theme.colors.primary }]}>
              Tổng điểm phát âm: {totalScore} Điểm
            </Text>
            <DuolingoButton
              title="HOÀN THÀNH"
              variant="primary"
              onPress={() => onFinish(totalScore)}
            />
          </View>
        </DuolingoCard>
      </View>
    );
  }

  const progressPct = ((currentIndex + 1) / cards.length) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.topGameHeader}>
        <Pressable
          onPress={() => onFinish(totalScore)}
          style={styles.backBtn}
          accessibilityLabel="Thoát trò chơi luyện nói"
        >
          <Icon name="back" size={22} color={theme.colors.textPrimary} />
          <Text style={[styles.backBtnText, { color: theme.colors.textPrimary }]}>
            Thoát game
          </Text>
        </Pressable>
        <Text style={[styles.gameHeaderTitle, { color: theme.colors.textSecondary }]}>
          LUYỆN PHÁT ÂM AI
        </Text>
      </View>

      <View style={styles.progressWrapper}>
        <ProgressBar progress={progressPct} color={theme.colors.primary} />
      </View>

      <DuolingoCard accessibilityLabel="Luyện đọc từ vựng tiếng Trung">
        <View style={styles.cardHeader}>
          <Text style={[styles.promptText, { color: theme.colors.textSecondary }]}>
            ĐỌC TO TỪ VỰNG SAU:
          </Text>
          <Pressable onPress={handlePlayAudio} style={styles.speakerBtn}>
            <Icon name="volume" size={24} color={theme.colors.primary} />
          </Pressable>
        </View>

        <Text style={[styles.kanjiText, { color: theme.colors.textPrimary }]}>
          {currentCard.kanji}
        </Text>
        <Text style={[styles.pinyinText, { color: theme.colors.primary }]}>
          {currentCard.pinyin}
        </Text>
        <Text style={[styles.meaningText, { color: theme.colors.textSecondary }]}>
          Nghĩa: {currentCard.meaning}
        </Text>
      </DuolingoCard>

      {/* Recording status & controls */}
      <View style={styles.recordSection}>
        <Pressable
          onPress={handleStartRecord}
          disabled={isRecording || isEvaluating}
          style={[
            styles.micButton,
            {
              backgroundColor: isRecording
                ? theme.colors.danger
                : isEvaluating
                ? theme.colors.secondary
                : theme.colors.primary,
            },
          ]}
        >
          <Icon name="mic" size={40} color="#FFFFFF" />
        </Pressable>

        <Text style={[styles.statusText, { color: theme.colors.textPrimary }]}>
          {isRecording
            ? "🎙️ Đang nghe... Hãy nói ngay!"
            : isEvaluating
            ? "🤖 AI đang phân tích âm điệu..."
            : "Nhấn Micro để bắt đầu đọc"}
        </Text>
      </View>

      {/* Feedback Card */}
      {feedback && (
        <View
          style={[
            styles.feedbackCard,
            {
              backgroundColor:
                feedback.score >= 80 ? theme.badges.learned.bg : theme.badges.due.bg,
            },
          ]}
        >
          <View style={styles.feedbackHeader}>
            <Text
              style={[
                styles.feedbackScore,
                {
                  color:
                    feedback.score >= 80 ? theme.colors.primary : theme.colors.danger,
                },
              ]}
            >
              {feedback.score}/100 Điểm
            </Text>
          </View>
          <Text
            style={[
              styles.feedbackDetail,
              {
                color:
                  feedback.score >= 80 ? theme.colors.primary : theme.colors.danger,
              },
            ]}
          >
            {feedback.feedbackText}
          </Text>

          <View style={{ marginTop: 12 }}>
            <DuolingoButton
              title={currentIndex + 1 < cards.length ? "TỪ TIẾP THEO" : "XEM KẾT QUẢ"}
              variant={feedback.score >= 80 ? "primary" : "secondary"}
              onPress={handleNext}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  progressWrapper: {
    marginBottom: 16,
  },
  infoText: {
    fontSize: 15,
    textAlign: "center",
  },
  doneBox: {
    alignItems: "center",
    padding: 16,
  },
  doneTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 12,
  },
  doneScore: {
    fontSize: 18,
    fontWeight: "700",
    marginVertical: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  promptText: {
    fontSize: 12,
    fontWeight: "700",
  },
  speakerBtn: {
    padding: 4,
  },
  kanjiText: {
    fontSize: 48,
    fontWeight: "900",
    textAlign: "center",
    marginVertical: 8,
  },
  pinyinText: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  meaningText: {
    fontSize: 14,
    textAlign: "center",
  },
  recordSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  feedbackScore: {
    fontSize: 18,
    fontWeight: "800",
  },
  feedbackDetail: {
    fontSize: 14,
    fontWeight: "600",
  },
  topGameHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 6,
    paddingRight: 10,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: "700",
  },
  gameHeaderTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
