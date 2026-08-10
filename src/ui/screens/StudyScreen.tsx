import React, { useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { DuolingoButton } from "../components/DuolingoButton.js";
import { DuolingoCard } from "../components/DuolingoCard.js";
import { FlashcardView } from "../components/FlashcardView.js";
import { Icon } from "../components/Icon.js";
import { ProgressBar } from "../components/ProgressBar.js";
import { QuizCardView } from "../components/QuizCardView.js";
import { SessionDoneScreen } from "../components/SessionDoneScreen.js";
import { theme } from "../theme/theme.js";
import { useTheme } from "../theme/ThemeContext.js";
import { useStudySession } from "../hooks/useStudySession.js";

export interface StudyScreenProps {
  deckId: string;
  onFinish: () => void;
}

export const StudyScreen: React.FC<StudyScreenProps> = ({ deckId, onFinish }) => {
  const { theme: activeTheme } = useTheme();
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

  const renderTopBar = (phaseLabel: string) => (
    <View style={styles.topBar}>
      <Pressable
        onPress={onFinish}
        style={styles.backBtn}
        accessibilityLabel="Thoát và giữ tiến độ học"
      >
        <Icon name="back" size={22} color={activeTheme.colors.textPrimary} />
        <Text style={[styles.backBtnText, { color: activeTheme.colors.textPrimary }]}>
          Thoát (Giữ tiến độ)
        </Text>
      </Pressable>
      <Text style={[styles.phaseLabel, { color: activeTheme.colors.textSecondary }]}>
        {phaseLabel}
      </Text>
    </View>
  );

  if (cards.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: activeTheme.colors.bg, padding: 16, justifyContent: "center" }]}>
        <DuolingoCard accessibilityLabel="Bộ thẻ chưa có từ vựng">
          <View style={{ alignItems: "center", paddingVertical: 16 }}>
            <Icon name="book" size={48} color={activeTheme.colors.primary} />
            <Text
              style={{
                fontSize: 16,
                fontWeight: "800",
                color: activeTheme.colors.textPrimary,
                marginTop: 12,
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              BỘ THẺ CHƯA CÓ TỪ VỰNG
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: activeTheme.colors.textSecondary,
                textAlign: "center",
                marginBottom: 16,
              }}
            >
              Vui lòng thêm thẻ từ vựng vào bộ thẻ này trước khi bắt đầu bài học Flashcard & Quiz.
            </Text>
            <View style={{ width: "100%" }}>
              <DuolingoButton title="QUAY LẠI" variant="primary" onPress={onFinish} />
            </View>
          </View>
        </DuolingoCard>
      </View>
    );
  }

  if (phase === "PREVIEW" && cards.length > 0) {
    const currentCard = cards[currentIndex];
    const progress = ((currentIndex + 1) / cards.length) * 100;

    return (
      <View style={[styles.container, { backgroundColor: activeTheme.colors.bg }]}>
        {renderTopBar("XEM TRƯỚC TỪ VỰNG")}
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
      <View style={[styles.container, { backgroundColor: activeTheme.colors.bg }]}>
        {renderTopBar("KIỂM TRA QUIZ")}
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
      <View style={[styles.container, { backgroundColor: activeTheme.colors.bg }]}>
        {renderTopBar("SỬA LỖI TỪ VỰNG")}
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.repairHeader}>
            <Icon name="wrench" size={28} color={activeTheme.colors.danger} />
            <Text style={[styles.repairTitle, { color: activeTheme.colors.danger }]}>
              GIAI ĐOẠN SỬA LỖI CẮM CỜ ({repairCards.length} từ sai)
            </Text>
          </View>
          <Text style={[styles.repairSubtitle, { color: activeTheme.colors.textSecondary }]}>
            Bạn vừa làm sai các từ vựng này trong bài Quiz. Hãy xem lại kỹ thẻ và ghi nhớ!
          </Text>

          {repairCards.map((card) => (
            <DuolingoCard key={card.id} accessibilityLabel={`Sửa lỗi từ ${card.kanji}`}>
              <View style={styles.repairCardInner}>
                <Text style={[styles.repairKanji, { color: activeTheme.colors.textPrimary }]}>
                  {card.kanji}
                </Text>
                <Text style={[styles.repairPinyin, { color: activeTheme.colors.primary }]}>
                  {card.pinyin}
                </Text>
                <Text style={[styles.repairMeaning, { color: activeTheme.colors.textSecondary }]}>
                  {card.meaning}
                </Text>
                {card.exampleSentence && (
                  <Text style={[styles.repairExample, { color: activeTheme.colors.textLight }]}>
                    "{card.exampleSentence}"
                  </Text>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
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
  phaseLabel: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
