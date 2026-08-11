import { useCallback, useEffect, useRef, useState } from "react";
import { ProcessCardReviewResult } from "../../application/usecases/ProcessCardReview.js";
import { QuizQuestion } from "../../application/usecases/GenerateQuiz.js";
import { CardEntity } from "../../domain/card/cardEntity.js";
import { Rating } from "../../domain/fsrs/fsrsTypes.js";
import { container } from "../../infrastructure/container.js";
import { appStore } from "../store/useAppStore.js";

export type SessionPhase = "PREVIEW" | "QUIZ" | "REPAIR" | "DONE";

export interface AnsweredItem {
  cardId: string;
  kanji: string;
  pinyin: string;
  meaning: string;
  isCorrect: boolean;
  rating: Rating;
}

export interface StudySessionState {
  phase: SessionPhase;
  cards: CardEntity[];
  quizQuestions: QuizQuestion[];
  currentIndex: number;
  repairCardIds: string[];
  repairCards: CardEntity[];
  totalXpEarned: number;
  correctCount: number;
  incorrectCount: number;
  questionStartTimeMs: number;
  answeredLog: AnsweredItem[];
}

export function useStudySession(deckId: string) {
  const [state, setState] = useState<StudySessionState>(() => ({
    phase: "PREVIEW",
    cards: [],
    quizQuestions: [],
    currentIndex: 0,
    repairCardIds: [],
    repairCards: [],
    totalXpEarned: 0,
    correctCount: 0,
    incorrectCount: 0,
    questionStartTimeMs: Date.now(),
    answeredLog: [],
  }));

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const startSession = useCallback(async () => {
    const deckCards = await container.cardRepo.getByDeckId(deckId);
    const questions = await container.generateQuiz.execute(deckId, 10);

    setState({
      phase: deckCards.length > 0 ? "PREVIEW" : "DONE",
      cards: deckCards,
      quizQuestions: questions,
      currentIndex: 0,
      repairCardIds: [],
      repairCards: [],
      totalXpEarned: 0,
      correctCount: 0,
      incorrectCount: 0,
      questionStartTimeMs: Date.now(),
      answeredLog: [],
    });
  }, [deckId]);

  const nextPreviewCard = () => {
    setState((prev) => {
      if (prev.currentIndex + 1 < prev.cards.length) {
        return { ...prev, currentIndex: prev.currentIndex + 1 };
      }
      // Finished preview -> move to Quiz
      return {
        ...prev,
        phase: "QUIZ",
        currentIndex: 0,
        questionStartTimeMs: Date.now(),
      };
    });
  };

  const prevPreviewCard = () => {
    setState((prev) => {
      if (prev.currentIndex > 0) {
        return { ...prev, currentIndex: prev.currentIndex - 1 };
      }
      return prev;
    });
  };

  const submitQuizAnswer = async (
    answer: string,
    elapsedMs?: number,
  ): Promise<{ isCorrect: boolean; rating: Rating; reviewResult?: ProcessCardReviewResult }> => {
    const currentState = stateRef.current;
    const currentQ = currentState.quizQuestions[currentState.currentIndex];
    if (!currentQ) return { isCorrect: false, rating: Rating.Again };

    const timeSpent = elapsedMs ?? Math.max(100, Date.now() - currentState.questionStartTimeMs);
    const isCorrect = answer === currentQ.correctAnswer;

    // Objective FSRS Rating Assignment:
    let rating: Rating = Rating.Again;
    if (isCorrect) {
      rating = timeSpent < 3000 ? Rating.Easy : Rating.Good;
    }

    const reviewResult = await container.processCardReview.execute({
      cardId: currentQ.cardId,
      rating,
    });

    appStore.addXp(reviewResult.xpEarned);
    appStore.updateStreak();

    setState((prev) => {
      const newXp = prev.totalXpEarned + reviewResult.xpEarned;
      const newCorrect = isCorrect ? prev.correctCount + 1 : prev.correctCount;
      const newIncorrect = !isCorrect ? prev.incorrectCount + 1 : prev.incorrectCount;
      const newRepairIds = !isCorrect
        ? [...new Set([...prev.repairCardIds, currentQ.cardId])]
        : prev.repairCardIds;

      const newRepairCards = prev.cards.filter((c) => newRepairIds.includes(c.id));

      const newAnsweredLog: AnsweredItem[] = [
        ...prev.answeredLog,
        {
          cardId: currentQ.cardId,
          kanji: currentQ.kanji,
          pinyin: currentQ.pinyin,
          meaning: currentQ.meaning,
          isCorrect,
          rating,
        },
      ];

      const isLastQuiz = prev.currentIndex + 1 >= prev.quizQuestions.length;

      if (isLastQuiz) {
        const nextPhase = newRepairIds.length > 0 ? "REPAIR" : "DONE";
        return {
          ...prev,
          phase: nextPhase,
          currentIndex: 0,
          totalXpEarned: newXp,
          correctCount: newCorrect,
          incorrectCount: newIncorrect,
          repairCardIds: newRepairIds,
          repairCards: newRepairCards,
          answeredLog: newAnsweredLog,
          questionStartTimeMs: Date.now(),
        };
      }

      return {
        ...prev,
        currentIndex: prev.currentIndex + 1,
        totalXpEarned: newXp,
        correctCount: newCorrect,
        incorrectCount: newIncorrect,
        repairCardIds: newRepairIds,
        repairCards: newRepairCards,
        answeredLog: newAnsweredLog,
        questionStartTimeMs: Date.now(),
      };
    });

    return { isCorrect, rating, reviewResult };
  };

  const completeRepairCard = (cardId: string) => {
    setState((prev) => {
      const remainingRepairIds = prev.repairCardIds.filter((id) => id !== cardId);
      const remainingRepairCards = prev.repairCards.filter((c) => c.id !== cardId);
      return {
        ...prev,
        repairCardIds: remainingRepairIds,
        repairCards: remainingRepairCards,
        phase: remainingRepairIds.length === 0 ? "DONE" : "REPAIR",
        questionStartTimeMs: Date.now(),
      };
    });
  };

  return {
    state,
    startSession,
    nextPreviewCard,
    prevPreviewCard,
    submitQuizAnswer,
    completeRepairCard,
  };
}
