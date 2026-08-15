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
  const fetchCards = useStore((s) => s.fetchCards);
  const batchUpdateCards = useStore((s) => s.batchUpdateCards);
  const pendingUpdatesRef = useRef<{ cardId: string; deckId: string; updates: Partial<Card> }[]>(
    [],
  );

  const isCardsLoaded = Boolean(deckId && cardsMap[deckId] !== undefined);
  const deckCards: Card[] = useMemo(() => (deckId ? cardsMap[deckId] || [] : []), [cardsMap, deckId]);

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
  const initializedDeckIdRef = useRef<string | null>(null);

  // Automatically fetch cards for deck if not already cached in store
  useEffect(() => {
    if (!deckId) return;
    if (cardsMap[deckId] === undefined) {
      fetchCards(deckId);
    }
  }, [deckId, cardsMap, fetchCards]);

  useEffect(() => {
    let active = true;

    const timer = setTimeout(() => {
      if (!active) return;

      if (!deckId) {
        setIsLoading(false);
        setStage("empty");
        return;
      }

      // Wait until cards have been fetched from backend / store
      if (!isCardsLoaded) {
        setIsLoading(true);
        return;
      }

      if (initializedDeckIdRef.current === deckId && session !== null) {
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

      initializedDeckIdRef.current = deckId;
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
      if (pendingUpdatesRef.current.length > 0) {
        batchUpdateCards(pendingUpdatesRef.current);
        pendingUpdatesRef.current = [];
      }
    };
  }, [batchUpdateCards, deckId, deckCards, isCardsLoaded, session]);

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

      // Calculate FSRS state (handles both first-time answers and retry answers)
      ratedCardIdsInSession.current.add(card.id);
      const { newSRS } = calculateQuizSRS(isCorrect, isRetry, responseTimeMs, currentSRS);
      const nowIso = new Date().toISOString();

      // Optimistically update card in Zustand store instantly
      useStore.setState((s) => ({
        cards: {
          ...s.cards,
          [deckId]: (s.cards[deckId] || []).map((c) =>
            c.id === card.id ? { ...c, srs: newSRS, lastReviewedAt: nowIso } : c,
          ),
        },
      }));

      // Update or append to pendingUpdatesRef (avoid duplicate entries for same card)
      const existingIdx = pendingUpdatesRef.current.findIndex((p) => p.cardId === card.id);
      const updateItem = {
        cardId: card.id,
        deckId,
        updates: { srs: newSRS, lastReviewedAt: nowIso },
      };
      if (existingIdx >= 0) {
        pendingUpdatesRef.current[existingIdx] = updateItem;
      } else {
        pendingUpdatesRef.current.push(updateItem);
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
            if (pendingUpdatesRef.current.length > 0) {
              await batchUpdateCards(pendingUpdatesRef.current);
              pendingUpdatesRef.current = [];
            }
          }
        } else {
          setStage("done");
          if (pendingUpdatesRef.current.length > 0) {
            await batchUpdateCards(pendingUpdatesRef.current);
            pendingUpdatesRef.current = [];
          }
        }
      }
    },
    [batchUpdateCards, deckCards, deckId, missedOrSlowCardIds, questions, session, targetCards],
  );

  const handleRepairAnswer = useCallback(
    async (isCorrect: boolean, responseTimeMs: number = 2000) => {
      const currentQuestion = repairQuestions[repairIndex];
      if (currentQuestion) {
        const card = currentQuestion.card;
        const currentSRS = card.srs || createDefaultSRSState();
        // Fast repair is inherently a retry round for a previously missed or slow card
        const isRetry = true;
        const { newSRS } = calculateQuizSRS(isCorrect, isRetry, responseTimeMs, currentSRS);
        const nowIso = new Date().toISOString();

        useStore.setState((s) => ({
          cards: {
            ...s.cards,
            [deckId]: (s.cards[deckId] || []).map((c) =>
              c.id === card.id ? { ...c, srs: newSRS, lastReviewedAt: nowIso } : c,
            ),
          },
        }));

        const existingIdx = pendingUpdatesRef.current.findIndex((p) => p.cardId === card.id);
        const updateItem = {
          cardId: card.id,
          deckId,
          updates: { srs: newSRS, lastReviewedAt: nowIso },
        };
        if (existingIdx >= 0) {
          pendingUpdatesRef.current[existingIdx] = updateItem;
        } else {
          pendingUpdatesRef.current.push(updateItem);
        }
        await recordReviewToday();
      }

      const nextIdx = repairIndex + 1;
      setRepairIndex(nextIdx);
      if (nextIdx >= repairQuestions.length) {
        setStage("done");
        if (pendingUpdatesRef.current.length > 0) {
          await batchUpdateCards(pendingUpdatesRef.current);
          pendingUpdatesRef.current = [];
        }
      }
    },
    [batchUpdateCards, deckId, repairIndex, repairQuestions],
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
