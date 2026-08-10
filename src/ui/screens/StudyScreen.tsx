import React, { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { FlashcardView } from "../components/FlashcardView.js";
import { Icon } from "../components/Icon.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { QuizCardView } from "../components/QuizCardView.js";
import { SessionDoneScreen } from "../components/SessionDoneScreen.js";
import { theme } from "../theme/theme.js";
import { useStudySession } from "../hooks/useStudySession.js";

export interface StudyScreenProps {
  deckId: string;
  onFinish: () => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({ deckId, onFinish }) => {
  const { state, startSession, nextPreviewCard, submitQuizAnswer, completeRepairCard } =
    useStudySession(deckId);

  useEffect(() => {
    startSession();
  }, [startSession]);

  const {
    phase,
    cards,
    quizQuestions,
    currentIndex,
    totalXpEarned,
    correctCount,
    incorrectCount,
    repairCards,
    answeredLog,
  } = state;

  if (phase === "PREVIEW" && cards.length > 0) {
    const currentCard = cards[currentIndex];
    const progress = ((currentIndex + 1) / cards.length) * 100;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProgressBar progress={progress} accessibilityLabel="Tiến trình xem trước từ vựng" />
          <FlashcardView
            card={currentCard}
            currentIndex={currentIndex}
            totalCards={cards.length}
            onNext={nextPreviewCard}
          />
        </ScrollView>
      </View>
    );
  }

  if (phase === "QUIZ" && quizQuestions.length > 0) {
    const currentQ = quizQuestions[currentIndex];
    const progress = ((currentIndex + 1) / quizQuestions.length) * 100;

    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <ProgressBar progress={progress} accessibilityLabel="Tiến trình làm bài quiz" />
          <QuizCardView
            question={currentQ}
            onAnswer={(option, elapsedMs) => submitQuizAnswer(option, elapsedMs)}
          />
        </ScrollView>
      </View>
    );
  }

  if (phase === "REPAIR" && repairCards.length > 0) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.repairHeader}>
            <Icon name="wrench" size={28} color={theme.colors.danger} />
            <Text style={styles.repairTitle}>
              GIAI ĐOẠN SỬA LỖI CẮM CỜ ({repairCards.length} từ sai)
            </Text>
          </View>
          <Text style={styles.repairSubtitle}>
            Bạn vừa làm sai các từ vựng này trong bài Quiz. Hãy xem lại kỹ thẻ và ghi nhớ!
          </Text>

          {repairCards.map((card) => (
            <DuolingoCard key={card.id} accessibilityLabel={`Sửa lỗi từ ${card.kanji}`}>
              <View style={styles.repairCardInner}>
                <Text style={styles.repairKanji}>{card.kanji}</Text>
                <Text style={styles.repairPinyin}>{card.pinyin}</Text>
                <Text style={styles.repairMeaning}>{card.meaning}</Text>
                {card.exampleSentence && (
                  <Text style={styles.repairExample}>"{card.exampleSentence}"</Text>
                )}

                <View style={styles.repairBtnWrapper}>
                  <DuolingoButton
                    title="ĐÃ HIỂU & GHI NHỚ LẠI"
                    variant="primary"
                    onPress={() => completeRepairCard(card.id)}
                    accessibilityLabel={`Đã ghi nhớ lại từ ${card.kanji}`}
                  />
                </View>
              </View>
            </DuolingoCard>
          ))}
        </ScrollView>
      </View>
    );
  }

  // Phase = DONE
  return (
    <SessionDoneScreen
      totalXpEarned={totalXpEarned}
      correctCount={correctCount}
      incorrectCount={incorrectCount}
      answeredLog={answeredLog}
      onFinish={onFinish}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    padding: theme.spacing.lg,
    paddingBottom: 100,
  },
  repairHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  repairTitle: {
    color: theme.colors.danger,
    fontSize: theme.fontSize.lg,
    fontWeight: theme.fontWeight.bold,
    flex: 1,
  },
  repairSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.fontSize.sm,
    marginBottom: theme.spacing.lg,
  },
  repairCardInner: {
    alignItems: "center",
    paddingVertical: theme.spacing.md,
  },
  repairKanji: {
    fontSize: 48,
    fontWeight: theme.fontWeight.black,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  repairPinyin: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  repairMeaning: {
    fontSize: theme.fontSize.base,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  repairExample: {
    fontSize: theme.fontSize.xs,
    fontStyle: "italic",
    color: theme.colors.textLight,
    marginBottom: theme.spacing.lg,
  },
  repairBtnWrapper: {
    width: "100%",
  },
});
