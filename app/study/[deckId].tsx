import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useStore } from "../../store/useStore";
import { generateQuizQuestion, QuizQuestion } from "../../lib/quizGenerator";
import { isDue, calculateSRS, createDefaultSRSState, SRSGrade, SRS_GRADES } from "../../lib/srs";
import { recordReviewToday } from "../../lib/reviewTracker";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { FlashcardView, ShortTermGrade } from "../../components/study/FlashcardView";
import { QuizCardView } from "../../components/study/QuizCardView";
import { SessionDoneScreen } from "../../components/study/SessionDoneScreen";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { StudySession, Card } from "../../store/slices/types";

type StudyMode = "flashcard" | "quiz";

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const cards = useStore((s) => s.cards);
  const updateCard = useStore((s) => s.updateCard);
  const fetchCards = useStore((s) => s.fetchCards);
  const isLoading = useStore((s) => s.isLoading);

  const deckCards = useMemo(() => cards[deckId] || [], [cards, deckId]);

  const [mode, setMode] = useState<StudyMode>("flashcard");
  const [session, setSession] = useState<StudySession | null>(null);
  const [targetCards, setTargetCards] = useState<Card[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isDone, setIsDone] = useState(false);
  const [isExtraPractice, setIsExtraPractice] = useState(false);

  // Track cards rated for SRS in the current session (prevents inflating SRS interval on intra-session re-attempts)
  const ratedCardIdsInSession = useRef<Set<string>>(new Set());

  // Guard: prevent session from being re-initialized when Zustand re-renders after each updateCard
  const sessionInitialized = useRef(false);

  useEffect(() => {
    if (deckId) fetchCards(deckId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const MAX_SESSION_CARDS = 20;

  useEffect(() => {
    if (deckCards.length > 0 && !sessionInitialized.current && !isDone) {
      sessionInitialized.current = true;
      ratedCardIdsInSession.current = new Set();
      const dueCards = deckCards.filter((c) => isDue(c.srs));
      const isExtra = dueCards.length === 0;
      setIsExtraPractice(isExtra);
      const pool = isExtra ? deckCards : dueCards;
      // Cap session to MAX_SESSION_CARDS, prioritize newest (repetitions === 0) first
      const sorted = [...pool].sort((a, b) => (a.srs?.repetitions ?? 0) - (b.srs?.repetitions ?? 0));
      const chosenCards = sorted.slice(0, MAX_SESSION_CARDS);
      const generatedQuestions: QuizQuestion[] = chosenCards
        .map((c) => generateQuizQuestion(c, deckCards))
        .filter((q): q is QuizQuestion => q !== null);

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTargetCards(chosenCards);
      setQuestions(generatedQuestions);
      setSession({
        deckId,
        queue: chosenCards,
        currentIndex: 0,
        correctCount: 0,
        reviewedCount: 0,
        startTime: new Date(),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckCards, deckId, isDone]);

  // Handle Flashcard Short-Term Memory Rating (Quên, Khó, Dễ)
  const handleFlashcardGrade = async (grade: ShortTermGrade) => {
    if (!session || targetCards.length === 0) return;

    const currentCard = targetCards[session.currentIndex];
    const srsGrade: SRSGrade = grade === "again" ? SRS_GRADES.AGAIN : grade === "hard" ? SRS_GRADES.HARD : SRS_GRADES.EASY;
    const currentSRS = currentCard.srs || createDefaultSRSState();
    const cardIsDue = isDue(currentSRS);

    // Chỉ cập nhật thuật toán SRS ở LẦN ĐẦU TIÊN gặp thẻ trong phiên này (tránh làm sai lệch ngày ôn ngắt quãng khi làm lại)
    if (!ratedCardIdsInSession.current.has(currentCard.id)) {
      ratedCardIdsInSession.current.add(currentCard.id);
      if (cardIsDue || grade === "again" || grade === "hard") {
        const newSRS = calculateSRS(srsGrade, currentSRS);
        await updateCard(currentCard.id, deckId, { srs: newSRS });
      }
    }

    await recordReviewToday();

    let updatedQueue = [...targetCards];
    const currIdx = session.currentIndex;

    if (grade === "again") {
      // QUÊN: Đưa thẻ trở lại hàng đợi sau 2 thẻ nữa để người dùng ôn lại sớm!
      const targetPos = Math.min(updatedQueue.length, currIdx + 3);
      updatedQueue.splice(targetPos, 0, currentCard);
    } else if (grade === "hard") {
      // KHÓ: Đưa thẻ trở lại hàng đợi sau 4 thẻ nữa để người dùng ôn lại trước khi kết thúc phiên!
      const targetPos = Math.min(updatedQueue.length, currIdx + 5);
      updatedQueue.splice(targetPos, 0, currentCard);
    }
    // DỄ / THUỘC: Thẻ được đánh giá thuộc hoàn toàn -> Không đưa lại vào hàng đợi phiên này!

    // Keep questions in sync with targetCards
    const syncedQuestions = updatedQueue
      .map((c) => generateQuizQuestion(c, deckCards))
      .filter((q): q is QuizQuestion => q !== null);

    const nextIndex = currIdx + 1;
    const isCorrect = grade === "easy";
    const newCorrect = isCorrect ? session.correctCount + 1 : session.correctCount;
    const newReviewed = session.reviewedCount + 1;

    setTargetCards(updatedQueue);
    setQuestions(syncedQuestions);

    setSession({
      ...session,
      queue: updatedQueue,
      currentIndex: nextIndex,
      correctCount: newCorrect,
      reviewedCount: newReviewed,
    });

    if (nextIndex >= updatedQueue.length) {
      setIsDone(true);
    }
  };

  // Handle Quiz Answer (Correct / Wrong - Short-Term Memory Re-study Loop)
  const handleQuizAnswer = async (isCorrect: boolean) => {
    if (!session || questions.length === 0) return;

    const currIdx = session.currentIndex;
    const currentQuestion = questions[currIdx];
    const card = currentQuestion.card;

    const grade: SRSGrade = isCorrect ? SRS_GRADES.EASY : SRS_GRADES.AGAIN;
    const currentSRS = card.srs || createDefaultSRSState();
    const cardIsDue = isDue(currentSRS);

    // Chỉ cập nhật thuật toán SRS ở LẦN ĐẦU TIÊN gặp thẻ trong phiên này
    if (!ratedCardIdsInSession.current.has(card.id)) {
      ratedCardIdsInSession.current.add(card.id);
      if (cardIsDue || !isCorrect) {
        const newSRS = calculateSRS(grade, currentSRS);
        await updateCard(card.id, deckId, { srs: newSRS });
      }
    }

    await recordReviewToday();

    let updatedQuestions = [...questions];
    let updatedCards = [...targetCards];
    if (!isCorrect) {
      // Short-Term Memory Queue: Re-insert wrong Quiz question 3 slots later so the user must get it right!
      const targetPos = Math.min(updatedQuestions.length, currIdx + 3);
      updatedQuestions.splice(targetPos, 0, currentQuestion);
      updatedCards.splice(targetPos, 0, card);
    }

    const nextIndex = currIdx + 1;
    const newCorrect = isCorrect ? session.correctCount + 1 : session.correctCount;
    const newReviewed = session.reviewedCount + 1;

    setQuestions(updatedQuestions);
    setTargetCards(updatedCards);

    setSession({
      ...session,
      queue: updatedCards,
      currentIndex: nextIndex,
      correctCount: newCorrect,
      reviewedCount: newReviewed,
    });

    if (nextIndex >= updatedQuestions.length) {
      setIsDone(true);
    }
  };

  const handleSwitchMode = useCallback((newMode: StudyMode) => {
    if (newMode === "quiz" && targetCards.length > 0) {
      const syncedQuestions = targetCards
        .map((c) => generateQuizQuestion(c, deckCards))
        .filter((q): q is QuizQuestion => q !== null);
      if (syncedQuestions.length > 0) {
        setQuestions(syncedQuestions);
      }
    }
    setMode(newMode);
  }, [targetCards, deckCards]);

  const handleExitSession = useCallback(() => {
    if (session && session.reviewedCount > 0) {
      Alert.alert(
        "Thoát phiên học?",
        "Tiến trình SRS của các thẻ đã ôn vẫn được lưu. Bạn có muốn thoát không?",
        [
          { text: "Tiếp tục học", style: "cancel" },
          { text: "Thoát", style: "destructive", onPress: () => router.back() },
        ],
      );
    } else {
      router.back();
    }
  }, [session]);

  if (isLoading || (!session && !isDone)) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.duolingo.green} />
      </View>
    );
  }

  // Use current mode array length for totalCount so re-inserted questions are properly counted
  const totalCount = mode === "flashcard" ? targetCards.length : questions.length;
  const progress = Math.min(1, (session?.currentIndex ?? 0) / Math.max(1, totalCount));

  if (isDone || !session || session.currentIndex >= totalCount) {
    return (
      <SessionDoneScreen
        session={session || {
          deckId,
          queue: [],
          currentIndex: 0,
          correctCount: 0,
          reviewedCount: 0,
          startTime: new Date(),
        }}
        onDone={() => router.back()}
      />
    );
  }

  const currentCard = targetCards[session.currentIndex];
  const currentQuestion = questions[session.currentIndex];

  return (
    <View style={styles.container}>
      {/* Duolingo Style Header Bar */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 8, 44) }]}>
        <TouchableOpacity
          onPress={handleExitSession}
          style={styles.closeHeaderBtn}
          activeOpacity={0.8}
        >
          <Ionicons name="close" size={26} color={Colors.duolingo.textMuted} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <ProgressBar
            progress={progress}
            height={16}
            fillColor={Colors.duolingo.green}
          />
        </View>

        {/* Extra Practice Badge */}
        {isExtraPractice && (
          <View style={styles.extraPracticeBadge}>
            <Text style={styles.extraPracticeText}>TỰ DO</Text>
          </View>
        )}
      </View>

      {/* Short Term Memory Study Mode Segment Bar */}
      <View style={styles.modeSegmentBar}>
        <TouchableOpacity
          style={[
            styles.modeSegmentBtn,
            mode === "flashcard" && styles.modeSegmentBtnActive,
          ]}
          onPress={() => handleSwitchMode("flashcard")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeSegmentText,
              mode === "flashcard" && styles.modeSegmentTextActive,
            ]}
          >
            LẬT THẺ FLASHCARD
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeSegmentBtn,
            mode === "quiz" && styles.modeSegmentBtnActive,
          ]}
          onPress={() => handleSwitchMode("quiz")}
          activeOpacity={0.8}
        >
          <Text
            style={[
              styles.modeSegmentText,
              mode === "quiz" && styles.modeSegmentTextActive,
            ]}
          >
            BÀI TẬP QUIZ
          </Text>
        </TouchableOpacity>
      </View>

      {/* MAIN VIEW CONTENT */}
      {mode === "flashcard" ? (
        currentCard ? (
          <FlashcardView
            key={`fc-${currentCard.id}-${session.currentIndex}`}
            card={currentCard}
            onGrade={handleFlashcardGrade}
          />
        ) : null
      ) : (
        currentQuestion ? (
          <QuizCardView
            key={`qz-${currentQuestion.card.id}-${session.currentIndex}`}
            question={currentQuestion}
            onAnswer={handleQuizAnswer}
          />
        ) : null
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.duolingo.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.pageMargin,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.duolingo.bg,
    gap: 8,
  },
  closeHeaderBtn: {
    padding: 4,
  },
  headerCenter: {
    flex: 1,
  },
  heartsBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.duolingo.cardBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderBottomWidth: 2,
    borderBottomColor: Colors.duolingo.cardBottom,
  },
  heartsText: {
    fontSize: 13,
    fontWeight: "800",
    color: Colors.duolingo.red,
  },

  modeSegmentBar: {
    flexDirection: "row",
    backgroundColor: Colors.duolingo.cardBg,
    marginHorizontal: Spacing.pageMargin,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: Radii.full,
    padding: 3,
    borderBottomWidth: 2,
    borderBottomColor: Colors.duolingo.cardBottom,
  },
  modeSegmentBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.full,
  },
  modeSegmentBtnActive: {
    backgroundColor: Colors.duolingo.blue,
    borderBottomWidth: 2,
    borderBottomColor: Colors.duolingo.blueDark,
  },
  modeSegmentText: {
    fontSize: 12,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    letterSpacing: 0.5,
  },
  modeSegmentTextActive: {
    color: "#FFFFFF",
  },
  extraPracticeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: Colors.duolingo.cardBg,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderBottomWidth: 2,
    borderBottomColor: Colors.duolingo.cardBottom,
  },
  extraPracticeText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.duolingo.yellow,
    letterSpacing: 0.5,
  },
});
