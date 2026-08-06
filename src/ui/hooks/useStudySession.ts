import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { generateQuizQuestion, QuizQuestion } from '../../application/usecases/GenerateQuiz';
import { WeakTagType } from '../../../components/study/QuizCardView';
import { triggerHaptic } from '../../../constants/theme';
import { CardEntity, ensureFSRSState } from '../../domain/card/cardEntity';
import { isDue } from '../../domain/card/cardUtils';
import { Rating } from '../../domain/fsrs/fsrsTypes';
import { useAppStore } from '../store/useAppStore';

export type SessionStage = 'preview' | 'validation' | 'repair' | 'done';

export interface StudySessionState {
  deckId: string;
  queue: CardEntity[];
  currentIndex: number;
  reviewedCount: number;
  correctCount: number;
  startTime: Date;
}

const MAX_SESSION_CARDS = 10;

export function useStudySession(deckId: string) {
  const cardsMap = useAppStore((s) => s.cards);
  const decks = useAppStore((s) => s.decks);
  const fetchCards = useAppStore((s) => s.fetchCards);
  const fetchDecks = useAppStore((s) => s.fetchDecks);
  const processReview = useAppStore((s) => s.processReview);
  const isCardLoading = useAppStore((s) => s.isCardLoading);

  const deckCards = useMemo(() => (deckId ? cardsMap[deckId] || [] : []), [cardsMap, deckId]);
  const deck = useMemo(
    () => (Array.isArray(decks) ? decks.find((d) => d.id === deckId) : undefined),
    [decks, deckId]
  );

  const [stage, setStage] = useState<SessionStage>('preview');
  const [session, setSession] = useState<StudySessionState | null>(null);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [targetCards, setTargetCards] = useState<CardEntity[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isExtraPractice, setIsExtraPractice] = useState(false);

  const [missedOrSlowCardIds, setMissedOrSlowCardIds] = useState<string[]>([]);
  const [repairQuestions, setRepairQuestions] = useState<QuizQuestion[]>([]);
  const [repairIndex, setRepairIndex] = useState(0);

  const ratedCardIdsInSession = useRef<Set<string>>(new Set());
  const sessionInitialized = useRef(false);

  useEffect(() => {
    if (deckId) fetchCards(deckId);
    if (!decks || decks.length === 0) fetchDecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  useEffect(() => {
    if (deckCards.length > 0 && !sessionInitialized.current && stage !== 'done' && deckId) {
      sessionInitialized.current = true;
      ratedCardIdsInSession.current = new Set();
      const dueCards = deckCards.filter((c) => {
        const fsrs = ensureFSRSState(c);
        return isDue({ due: fsrs.due });
      });
      const isExtra = dueCards.length === 0;
      setIsExtraPractice(isExtra);
      const pool = isExtra ? deckCards : dueCards;

      const sorted = [...pool].sort((a, b) => {
        const aReps = ensureFSRSState(a).reps;
        const bReps = ensureFSRSState(b).reps;
        return aReps - bReps;
      });
      const chosenCards = sorted.slice(0, MAX_SESSION_CARDS);
      const generatedQuestions: QuizQuestion[] = chosenCards
        .map((c) => generateQuizQuestion(c, deckCards))
        .filter((q): q is QuizQuestion => q !== null);

      setTargetCards(chosenCards);
      setQuestions(generatedQuestions);
      setPreviewIndex(0);
      setStage('preview');
      setSession({
        deckId,
        queue: chosenCards,
        currentIndex: 0,
        correctCount: 0,
        reviewedCount: 0,
        startTime: new Date(),
      });
    }
  }, [deckCards, deckId, stage]);

  const handleNextPreview = useCallback(() => {
    if (previewIndex < targetCards.length - 1) {
      setPreviewIndex((prev) => prev + 1);
    } else {
      triggerHaptic('success');
      setStage('validation');
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

      if (!isRetry || !isCorrect) {
        ratedCardIdsInSession.current.add(card.id);
        let fsrsRating: Rating = Rating.Good;
        if (!isCorrect) {
          fsrsRating = Rating.Again;
        } else if (isRetry) {
          fsrsRating = Rating.Hard;
        } else if (responseTimeMs <= 3500) {
          fsrsRating = Rating.Easy;
        }

        await processReview(card, fsrsRating);
      }

      if (!isCorrect || responseTimeMs > 4000) {
        setMissedOrSlowCardIds((prev) => (prev.includes(card.id) ? prev : [...prev, card.id]));
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

      setSession({
        ...session,
        queue: updatedCards,
        currentIndex: nextIndex,
        correctCount: newCorrect,
        reviewedCount: newReviewed,
      });

      if (nextIndex >= updatedQuestions.length) {
        const updatedMissed =
          !isCorrect || responseTimeMs > 4000
            ? missedOrSlowCardIds.includes(card.id)
              ? missedOrSlowCardIds
              : [...missedOrSlowCardIds, card.id]
            : missedOrSlowCardIds;

        const weakCards = targetCards.filter((c) => updatedMissed.includes(c.id));

        if (weakCards.length > 0) {
          const repairQs = weakCards
            .map((c) => generateQuizQuestion(c, deckCards))
            .filter((q): q is QuizQuestion => q !== null);
          setRepairQuestions(repairQs);
          setRepairIndex(0);
          setStage('repair');
        } else {
          setStage('done');
        }
      }
    },
    [session, questions, targetCards, deckCards, processReview, missedOrSlowCardIds]
  );

  const handleRepairAnswer = useCallback(
    async (isCorrect: boolean, responseTimeMs: number = 2000) => {
      const currentQuestion = repairQuestions[repairIndex];
      if (currentQuestion) {
        const card = currentQuestion.card;
        let rating = isCorrect ? Rating.Hard : Rating.Again;
        await processReview(card, rating);
      }

      const nextIdx = repairIndex + 1;
      setRepairIndex(nextIdx);
      if (nextIdx >= repairQuestions.length) {
        setStage('done');
      }
    },
    [repairQuestions, repairIndex, processReview]
  );

  const handleExitSession = useCallback(() => {
    if (session && session.reviewedCount > 0) {
      Alert.alert(
        'Thoát phiên học?',
        'Tiến trình FSRS của các thẻ đã làm Quiz đã được tự động lưu. Bạn có muốn thoát không?',
        [
          { text: 'Tiếp tục học', style: 'cancel' },
          { text: 'Thoát', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  }, [session]);

  const progress = useMemo(() => {
    if (stage === 'preview') {
      return Math.min(1, (previewIndex + 1) / Math.max(1, targetCards.length));
    } else if (stage === 'validation') {
      return session ? Math.min(1, session.currentIndex / Math.max(1, questions.length)) : 0;
    } else if (stage === 'repair') {
      return Math.min(1, (repairIndex + 1) / Math.max(1, repairQuestions.length));
    }
    return 1;
  }, [stage, previewIndex, targetCards.length, session, questions.length, repairIndex, repairQuestions.length]);

  const currentPreviewCard = useMemo(() => {
    const currentPreviewCardId = targetCards[previewIndex]?.id;
    return deckCards.find((c) => c.id === currentPreviewCardId) ?? targetCards[previewIndex];
  }, [deckCards, targetCards, previewIndex]);

  const currentValidationQuestion = useMemo(() => {
    return session ? questions[session.currentIndex] : undefined;
  }, [session, questions]);

  const currentRepairQuestion = useMemo(() => {
    return repairQuestions[repairIndex];
  }, [repairQuestions, repairIndex]);

  return {
    stage,
    session,
    deck,
    deckCards,
    isCardLoading,
    targetCards,
    questions,
    previewIndex,
    repairIndex,
    repairQuestions,
    isExtraPractice,
    progress,
    currentPreviewCard,
    currentValidationQuestion,
    currentRepairQuestion,
    processReview,
    handleNextPreview,
    handlePrevPreview,
    handleQuizAnswer,
    handleRepairAnswer,
    handleExitSession,
  };
}
