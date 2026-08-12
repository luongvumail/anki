import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useStore } from "../store/useStore";
import { Card, StudySession } from "../store/slices/types";
import { QuizQuestion, generateQuizQuestion } from "../lib/quizGenerator";
import { isDue, calculateQuizSRS, createDefaultSRSState } from "../lib/srs";
import { recordReviewToday } from "../lib/reviewTracker";
import { WeakTagType } from "../components/study/QuizCardView";
import { APP_CONFIG } from "../constants/config";

export type SessionStage = "preview" | "validation" | "repair" | "done";

export function useStudySession(deckId: string) {
  const cards = useStore((s) => s.cards);
  const updateCard = useStore((s) => s.updateCard);
  const fetchCards = useStore((s) => s.fetchCards);
  const isLoading = useStore((s) => s.isLoading);

  const deckCards = useMemo(() => cards[deckId] || [], [cards, deckId]);

  const [stage, setStage] = useState<SessionStage>("preview");
  const [session, setSession] = useState<StudySession | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [targetCards, setTargetCards] = useState<Card[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isExtraPractice, setIsExtraPractice] = useState(false);

  const [missedOrSlowCardIds, setMissedOrSlowCardIds] = useState<string[]>([]);
  const [repairQuestions, setRepairQuestions] = useState<QuizQuestion[]>([]);
  const [repairIndex, setRepairIndex] = useState(0);

  const ratedCardIdsInSession = useRef<Set<string>>(new Set());
  const sessionInitialized = useRef(false);

  const stageRef = useRef(stage);
  useEffect(() => {
    stageRef.current = stage;
  }, [stage]);

  useEffect(() => {
    if (deckId) fetchCards(deckId);
  }, [deckId, fetchCards]);

  useEffect(() => {
    if (deckCards.length > 0 && !sessionInitialized.current && stageRef.current !== "done") {
      sessionInitialized.current = true;
      ratedCardIdsInSession.current = new Set();
      const dueCards = deckCards.filter((c) => isDue(c.srs));
      const isExtra = dueCards.length === 0;
      setIsExtraPractice(isExtra);
      const pool = isExtra ? deckCards : dueCards;

      const sorted = [...pool].sort((a, b) => (a.srs?.repetitions ?? 0) - (b.srs?.repetitions ?? 0));
      const chosenCards = sorted.slice(0, APP_CONFIG.MAX_SESSION_CARDS);
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
  }, [deckCards, deckId]);

  const handleNextPreview = useCallback(() => {
    if (previewIndex < targetCards.length - 1) {
      setPreviewIndex((prev) => prev + 1);
    } else {
      setStage("validation");
      setSession((prev) => (prev ? { ...prev, currentIndex: 0 } : null));
    }
  }, [previewIndex, targetCards.length]);

  const handlePrevPreview = useCallback(() => {
    if (previewIndex > 0) {
      setPreviewIndex((prev) => prev - 1);
    }
  }, [previewIndex]);

  const handleQuizAnswer = useCallback(
    async (isCorrect: boolean, responseTimeMs: number, weakTag?: WeakTagType) => {
      if (!session || questions.length === 0) return;

      const currIdx = session.currentIndex;
      const currentQuestion = questions[currIdx];
      const card = currentQuestion.card;

      const isRetry = ratedCardIdsInSession.current.has(card.id);
      const currentSRS = card.srs || createDefaultSRSState();

      if (!isRetry || !isCorrect) {
        ratedCardIdsInSession.current.add(card.id);
        const { newSRS } = calculateQuizSRS(isCorrect, isRetry, responseTimeMs, currentSRS);
        await updateCard(card.id, deckId, { srs: newSRS });
      }

      await recordReviewToday();

      const isSlowOrMissed = !isCorrect || responseTimeMs > APP_CONFIG.REPAIR_SLOW_THRESHOLD_MS;
      let nextMissed = missedOrSlowCardIds;
      if (isSlowOrMissed) {
        nextMissed = missedOrSlowCardIds.includes(card.id)
          ? missedOrSlowCardIds
          : [...missedOrSlowCardIds, card.id];
        setMissedOrSlowCardIds(nextMissed);
      }

      let updatedQuestions = [...questions];
      let updatedCards = [...targetCards];

      if (!isCorrect) {
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

      setSession((prev) =>
        prev
          ? {
              ...prev,
              queue: updatedCards,
              currentIndex: nextIndex,
              correctCount: newCorrect,
              reviewedCount: newReviewed,
            }
          : null
      );

      if (nextIndex >= updatedQuestions.length) {
        const weakCards = targetCards.filter((c) => nextMissed.includes(c.id));

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
    },
    [deckCards, deckId, missedOrSlowCardIds, questions, session, targetCards, updateCard]
  );

  const handleRepairAnswer = useCallback(
    async (isCorrect: boolean, responseTimeMs: number = 2000) => {
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
    },
    [deckId, repairIndex, repairQuestions, updateCard]
  );

  return {
    stage,
    session,
    isLoading,
    deckCards,
    previewIndex,
    targetCards,
    questions,
    repairQuestions,
    repairIndex,
    isExtraPractice,
    handleNextPreview,
    handlePrevPreview,
    handleQuizAnswer,
    handleRepairAnswer,
    setStage,
  };
}
