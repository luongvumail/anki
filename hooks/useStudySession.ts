import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Card, StudySession } from "../store/slices/types";
import { useStore } from "../store/useStore";
import { APP_CONFIG } from "../constants/config";
import { isDue, calculateQuizSRS, createDefaultSRSState } from "../lib/srs";
import { generateQuizQuestion, QuizQuestion } from "../lib/quizGenerator";
import { recordReviewToday } from "../lib/reviewTracker";

export type SessionStage = "loading" | "empty" | "preview" | "validation" | "repair" | "done";

export function useStudySession(deckId: string) {
  const cardsMap = useStore((s) => s.cards);
  const updateCard = useStore((s) => s.updateCard);

  const deckCards: Card[] = useMemo(() => cardsMap[deckId] || [], [cardsMap, deckId]);

  const [session, setSession] = useState<StudySession | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [targetCards, setTargetCards] = useState<Card[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [stage, setStage] = useState<SessionStage>("loading");
  const [isLoading, setIsLoading] = useState(true);

  const [missedOrSlowCardIds, setMissedOrSlowCardIds] = useState<string[]>([]);
  const [repairQuestions, setRepairQuestions] = useState<QuizQuestion[]>([]);
  const [repairIndex, setRepairIndex] = useState(0);

  const ratedCardIdsInSession = useRef<Set<string>>(new Set());

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      if (!deckId) {
        setIsLoading(false);
        setStage("empty");
        return;
      }

      let due = deckCards.filter((c: Card) => isDue(c.srs));
      if (due.length === 0) {
        due = [...deckCards].sort(() => Math.random() - 0.5);
      }
      const sessionCards = due.slice(0, APP_CONFIG.MAX_SESSION_CARDS);

      if (sessionCards.length === 0) {
        setIsLoading(false);
        setStage("empty");
        return;
      }

      const generated: QuizQuestion[] = [];
      sessionCards.forEach((c: Card) => {
        const q = generateQuizQuestion(c, deckCards);
        if (q) generated.push(q);
      });

      if (generated.length === 0) {
        setIsLoading(false);
        setStage("empty");
        return;
      }

      setTargetCards(sessionCards);
      setQuestions(generated);
      setPreviewIndex(0);
      setSession({
        deckId,
        queue: sessionCards,
        currentIndex: 0,
        reviewedCount: 0,
        correctCount: 0,
        startTime: new Date(),
      });
      setIsLoading(false);
      setStage("preview");
      ratedCardIdsInSession.current.clear();
    }, 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [deckId, deckCards]);

  const handleNextPreview = useCallback(() => {
    setPreviewIndex((prev) => {
      const next = prev + 1;
      if (next >= targetCards.length) {
        setStage("validation");
        return prev;
      }
      return next;
    });
  }, [targetCards.length]);

  const handlePrevPreview = useCallback(() => {
    setPreviewIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const handleQuizAnswer = useCallback(
    async (isCorrect: boolean, responseTimeMs: number) => {
      if (!session) return;
      const currIdx = session.currentIndex;
      if (currIdx >= questions.length) return;

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
        const nextQuestion = generateQuizQuestion(card, deckCards);
        if (nextQuestion) {
          const targetPos = Math.min(updatedQuestions.length, currIdx + 3);
          updatedQuestions.splice(targetPos, 0, nextQuestion);
          updatedCards.splice(targetPos, 0, card);
        }
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
          : null,
      );

      if (nextIndex >= updatedQuestions.length) {
        const weakCards = targetCards.filter((c: Card) => nextMissed.includes(c.id));

        if (weakCards.length > 0) {
          const repairQs = weakCards
            .map((c: Card) => generateQuizQuestion(c, deckCards))
            .filter((q): q is QuizQuestion => q !== null);
          if (repairQs.length > 0) {
            setRepairQuestions(repairQs);
            setRepairIndex(0);
            setStage("repair");
          } else {
            setStage("done");
          }
        } else {
          setStage("done");
        }
      }
    },
    [deckCards, deckId, missedOrSlowCardIds, questions, session, targetCards, updateCard],
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
    [deckId, repairIndex, repairQuestions, updateCard],
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
    handleNextPreview,
    handlePrevPreview,
    handleQuizAnswer,
    handleRepairAnswer,
  };
}
