import { CardEntity, ensureFSRSState } from "../card/cardEntity";
import { isDue } from "../card/cardUtils";
import { Rating } from "../fsrs/fsrsTypes";
import { generateQuizQuestion, QuizQuestion } from "../../application/usecases/GenerateQuiz";

export interface PreparedStudySession {
  targetCards: CardEntity[];
  questions: QuizQuestion[];
  isExtraPractice: boolean;
}

export class StudySessionEngine {
  private maxSessionCards: number;

  constructor(maxSessionCards: number = 10) {
    this.maxSessionCards = maxSessionCards;
  }

  /**
   * Prepares and initializes cards and questions pool for a study session.
   */
  public prepareSession(deckCards: CardEntity[]): PreparedStudySession {
    if (!deckCards || deckCards.length === 0) {
      return { targetCards: [], questions: [], isExtraPractice: false };
    }

    const dueCards = deckCards.filter((c) => {
      const fsrs = ensureFSRSState(c);
      return isDue({ due: fsrs.due });
    });

    const isExtraPractice = dueCards.length === 0;
    const pool = isExtraPractice ? deckCards : dueCards;

    const sorted = [...pool].sort((a, b) => {
      const aReps = ensureFSRSState(a).reps;
      const bReps = ensureFSRSState(b).reps;
      return aReps - bReps;
    });

    const targetCards = sorted.slice(0, this.maxSessionCards);
    const questions: QuizQuestion[] = targetCards
      .map((c) => generateQuizQuestion(c, deckCards))
      .filter((q): q is QuizQuestion => q !== null);

    return { targetCards, questions, isExtraPractice };
  }

  /**
   * Determines FSRS rating based on correctness, reaction time, and retry state.
   */
  public determineFSRSRating(
    isCorrect: boolean,
    responseTimeMs: number,
    isRetry: boolean,
  ): Rating {
    if (!isCorrect) {
      return Rating.Again;
    }
    if (isRetry) {
      return Rating.Hard;
    }
    if (responseTimeMs <= 3500) {
      return Rating.Easy;
    }
    return Rating.Good;
  }
}
