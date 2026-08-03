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
import { isDue, calculateQuizSRS, createDefaultSRSState } from "../../lib/srs";
import { recordReviewToday } from "../../lib/reviewTracker";
import { Colors, Spacing, Radii, triggerHaptic } from "../../constants/theme";
import { FlashcardView } from "../../components/study/FlashcardView";
import { QuizCardView, WeakTagType } from "../../components/study/QuizCardView";
import { SessionDoneScreen } from "../../components/study/SessionDoneScreen";
import { ProgressBar } from "../../components/ui/ProgressBar";
import { DuolingoButton } from "../../components/ui/DuolingoButton";
import { StudySession, Card } from "../../store/slices/types";

type SessionStage = "preview" | "validation" | "repair" | "done";

export default function StudyScreen() {
  const insets = useSafeAreaInsets();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const cards = useStore((s) => s.cards);
  const decks = useStore((s) => s.decks);
  const updateCard = useStore((s) => s.updateCard);
  const fetchCards = useStore((s) => s.fetchCards);
  const isLoading = useStore((s) => s.isLoading);

  const deckCards = useMemo(() => cards[deckId] || [], [cards, deckId]);
  const deck = useMemo(
    () => (Array.isArray(decks) ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId],
  );

  const [stage, setStage] = useState<SessionStage>("preview");
  const [session, setSession] = useState<StudySession | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [targetCards, setTargetCards] = useState<Card[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isExtraPractice, setIsExtraPractice] = useState(false);

  // Track missed or slow response cards during validation for Fast Repair Loop
  const [missedOrSlowCardIds, setMissedOrSlowCardIds] = useState<string[]>([]);
  const [repairQuestions, setRepairQuestions] = useState<QuizQuestion[]>([]);
  const [repairIndex, setRepairIndex] = useState(0);

  // Track cards rated for SRS in the current session (prevents inflating SRS interval on intra-session re-attempts)
  const ratedCardIdsInSession = useRef<Set<string>>(new Set());

  // Guard: prevent session from being re-initialized when Zustand re-renders
  const sessionInitialized = useRef(false);

  const fetchDecks = useStore((s) => s.fetchDecks);

  useEffect(() => {
    if (deckId) fetchCards(deckId);
    if (!decks || decks.length === 0) fetchDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const MAX_SESSION_CARDS = 10;

  useEffect(() => {
    if (deckCards.length > 0 && !sessionInitialized.current && stage !== "done") {
      sessionInitialized.current = true;
      ratedCardIdsInSession.current = new Set();
      const dueCards = deckCards.filter((c) => isDue(c.srs));
      const isExtra = dueCards.length === 0;
      setIsExtraPractice(isExtra);
      const pool = isExtra ? deckCards : dueCards;

      // Prioritize newest (repetitions === 0) first, cap to MAX_SESSION_CARDS
      const sorted = [...pool].sort((a, b) => (a.srs?.repetitions ?? 0) - (b.srs?.repetitions ?? 0));
      const chosenCards = sorted.slice(0, MAX_SESSION_CARDS);
      const generatedQuestions: QuizQuestion[] = chosenCards
        .map((c) => generateQuizQuestion(c, deckCards))
        .filter((q): q is QuizQuestion => q !== null);

      setTargetCards(chosenCards);
      setQuestions(generatedQuestions);
      setPreviewIndex(0);
      setStage("preview");
      setSession({
        deckId,
        queue: chosenCards,
        currentIndex: 0,
        correctCount: 0,
        reviewedCount: 0,
        startTime: new Date(),
      });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  }, [deckCards, deckId]);

  // Stage 1: Flashcard Preview Navigation
  const handleNextPreview = () => {
    if (previewIndex < targetCards.length - 1) {
      setPreviewIndex((prev) => prev + 1);
    } else {
      // Transition from Preview ➔ Validation Quiz
      triggerHaptic("success");
      setStage("validation");
      setSession((prev) => (prev ? { ...prev, currentIndex: 0 } : null));
    }
  };

  const handlePrevPreview = () => {
    if (previewIndex > 0) {
      setPreviewIndex((prev) => prev - 1);
    }
  };


  // Stage 2: Quiz Validation Callback with Objective SRS calculation
  const handleQuizAnswer = async (
    isCorrect: boolean,
    responseTimeMs: number,
    weakTag?: WeakTagType
  ) => {
    if (!session || questions.length === 0) return;

    const currIdx = session.currentIndex;
    const currentQuestion = questions[currIdx];
    const card = currentQuestion.card;

    const isRetry = ratedCardIdsInSession.current.has(card.id);
    const currentSRS = card.srs || createDefaultSRSState();

    // Update SRS state only on 1st attempt or if incorrect
    if (!isRetry || !isCorrect) {
      ratedCardIdsInSession.current.add(card.id);
      const { newSRS } = calculateQuizSRS(isCorrect, isRetry, responseTimeMs, currentSRS);
      await updateCard(card.id, deckId, { srs: newSRS });
    }

    await recordReviewToday();

    // Track missed or slow cards for Fast Repair Stage
    if (!isCorrect || responseTimeMs > 4000) {
      setMissedOrSlowCardIds((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
    }

    let updatedQuestions = [...questions];
    let updatedCards = [...targetCards];

    if (!isCorrect) {
      // Re-queue missed question 2 slots later
      const nextQuestion = generateQuizQuestion(card, deckCards, undefined, weakTag);
      const targetPos = Math.min(updatedQuestions.length, currIdx + 3);
      updatedQuestions.splice(targetPos, 0, nextQuestion);
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
      // Check if Fast Repair Loop is needed using accumulated missedOrSlowCardIds
      const updatedMissed = (!isCorrect || responseTimeMs > 4000)
        ? (missedOrSlowCardIds.includes(card.id) ? missedOrSlowCardIds : [...missedOrSlowCardIds, card.id])
        : missedOrSlowCardIds;

      const weakCards = targetCards.filter((c) => updatedMissed.includes(c.id));

      if (weakCards.length > 0) {
        const repairQs = weakCards
          .map((c) => generateQuizQuestion(c, deckCards))
          .filter((q): q is QuizQuestion => q !== null);
        setRepairQuestions(repairQs);
        setRepairIndex(0);
        setStage("repair");
      } else {
        setStage("done");
      }
    }
  };

  // Stage 3: Fast Repair Callback with SRS Update
  const handleRepairAnswer = async (isCorrect: boolean, responseTimeMs: number = 2000) => {
    const currentQuestion = repairQuestions[repairIndex];
    if (currentQuestion) {
      const card = currentQuestion.card;
      const currentSRS = card.srs || createDefaultSRSState();
      const { newSRS } = calculateQuizSRS(isCorrect, true, responseTimeMs, currentSRS);
      await updateCard(card.id, deckId, { srs: newSRS });
      await recordReviewToday();
    }

    const nextIdx = repairIndex + 1;
    setRepairIndex(nextIdx);
    if (nextIdx >= repairQuestions.length) {
      setStage("done");
    }
  };

  const handleSwitchStage = (targetStage: SessionStage) => {
    setStage(targetStage);
  };

  const handleExitSession = useCallback(() => {
    if (session && session.reviewedCount > 0) {
      Alert.alert(
        "Thoát phiên học?",
        "Tiến trình SRS của các thẻ đã làm Quiz đã được tự động lưu. Bạn có muốn thoát không?",
        [
          { text: "Tiếp tục học", style: "cancel" },
          { text: "Thoát", style: "destructive", onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [session]);

  if (!isLoading && deckCards.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="book-outline" size={48} color={Colors.duolingo.textMuted} style={{ marginBottom: 12 }} />
        <Text style={{ fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginBottom: 6 }}>
          Bộ thẻ này chưa có từ vựng!
        </Text>
        <Text style={{ fontSize: 13, color: Colors.duolingo.textMuted, textAlign: "center", marginBottom: 20, paddingHorizontal: 32 }}>
          Vui lòng quay lại danh sách bộ thẻ và thêm thẻ từ vựng trước khi bắt đầu học.
        </Text>
        <DuolingoButton
          title="QUAY LẠI"
          variant="primary"
          size="md"
          onPress={() => router.back()}
          style={{ width: 160 }}
        />
      </View>
    );
  }

  if (isLoading || (!session && stage !== "done")) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.duolingo.green} />
      </View>
    );
  }

  if (stage === "done" || !session) {
    return (
      <SessionDoneScreen
        session={
          session || {
            deckId,
            queue: [],
            currentIndex: 0,
            correctCount: 0,
            reviewedCount: 0,
            startTime: new Date(),
          }
        }
        onDone={() => router.back()}
      />
    );
  }

  // Calculate Progress
  let progress = 0;
  if (stage === "preview") {
    progress = Math.min(1, (previewIndex + 1) / Math.max(1, targetCards.length));
  } else if (stage === "validation") {
    progress = Math.min(1, session.currentIndex / Math.max(1, questions.length));
  } else if (stage === "repair") {
    progress = Math.min(1, (repairIndex + 1) / Math.max(1, repairQuestions.length));
  }

  // Resolve current preview card LIVE from deckCards (not the snapshot in targetCards)
  // This ensures fields updated after session init (e.g. radical) are always shown.
  const currentPreviewCardId = targetCards[previewIndex]?.id;
  const currentPreviewCard = deckCards.find((c) => c.id === currentPreviewCardId) ?? targetCards[previewIndex];
  const currentValidationQuestion = questions[session.currentIndex];
  const currentRepairQuestion = repairQuestions[repairIndex];

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
          <Text style={styles.deckHeaderTitle} numberOfLines={1}>
            {deck?.name || "HỌC TỪ VỰNG"}
          </Text>
          <ProgressBar
            progress={progress}
            height={14}
            fillColor={
              stage === "preview"
                ? Colors.duolingo.blue
                : stage === "repair"
                ? Colors.duolingo.yellow
                : Colors.duolingo.green
            }
          />
        </View>

        {/* Phase Indicator Badge with Vector Icon */}
        <View
          style={[
            styles.stageBadge,
            stage === "preview"
              ? styles.stageBadgePreview
              : stage === "repair"
              ? styles.stageBadgeRepair
              : styles.stageBadgeValidation,
          ]}
        >
          <Ionicons
            name={
              stage === "preview"
                ? "card-outline"
                : stage === "repair"
                ? "flash"
                : "checkmark-circle-outline"
            }
            size={13}
            color={
              stage === "preview"
                ? Colors.duolingo.blue
                : stage === "repair"
                ? Colors.duolingo.yellow
                : Colors.duolingo.green
            }
          />
          <Text
            style={[
              styles.stageBadgeText,
              {
                color:
                  stage === "preview"
                    ? Colors.duolingo.blue
                    : stage === "repair"
                    ? Colors.duolingo.yellow
                    : Colors.duolingo.green,
              },
            ]}
          >
            {stage === "preview"
              ? "NẠP TỪ"
              : stage === "repair"
              ? "CẮM CỜ"
              : "KIỂM TRA"}
          </Text>
        </View>
      </View>

      {/* MAIN VIEW STAGE CONTENT - WRAPPED WITH OVERFLOW HIDDEN */}
      <View style={styles.stageContentContainer}>
        {stage === "preview" ? (
          currentPreviewCard ? (
          <FlashcardView
              key={`fc-${currentPreviewCard.id}-${previewIndex}`}
              card={currentPreviewCard}
              currentIndex={previewIndex}
              totalCards={targetCards.length}
              onNext={handleNextPreview}
              onPrev={handlePrevPreview}
            />
          ) : null
        ) : stage === "validation" ? (
          currentValidationQuestion ? (
            <QuizCardView
              key={`qz-${currentValidationQuestion.card.id}-${session.currentIndex}`}
              question={currentValidationQuestion}
              onAnswer={handleQuizAnswer}
            />
          ) : null
        ) : stage === "repair" ? (
          currentRepairQuestion ? (
            <QuizCardView
              key={`rp-${currentRepairQuestion.card.id}-${repairIndex}`}
              question={currentRepairQuestion}
              isFastRepairMode={true}
              onAnswer={handleRepairAnswer}
            />
          ) : null
        ) : null}
      </View>
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
    paddingHorizontal: 4,
  },
  deckHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: Colors.duolingo.textMuted,
    letterSpacing: 0.8,
    marginBottom: 4,
    textAlign: "center",
  },
  stageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
  },
  stageBadgePreview: {
    backgroundColor: Colors.duolingo.blueDim,
  },
  stageBadgeValidation: {
    backgroundColor: Colors.duolingo.greenDim,
  },
  stageBadgeRepair: {
    backgroundColor: Colors.duolingo.yellowDim,
  },
  stageBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  stageContentContainer: {
    flex: 1,
    overflow: "hidden",
  },
});
