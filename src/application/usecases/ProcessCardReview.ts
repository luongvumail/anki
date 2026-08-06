import { CardEntity, ensureFSRSState } from "../../domain/card/cardEntity";
import { FSRSEngine } from "../../domain/fsrs/fsrsEngine";
import { Rating, ReviewLog } from "../../domain/fsrs/fsrsTypes";
import { StreakCalculator, StreakState } from "../../domain/streak/streakCalculator";

export interface ProcessCardReviewInput {
  card: CardEntity;
  rating: Rating;
  now?: Date;
  currentStreak?: StreakState;
}

export interface ProcessCardReviewOutput {
  updatedCard: CardEntity;
  reviewLog: ReviewLog;
  earnedXP: number;
  newStreak?: StreakState;
}

export class ProcessCardReviewUseCase {
  private engine: FSRSEngine;
  private streakCalculator: StreakCalculator;

  constructor(
    engine: FSRSEngine = new FSRSEngine(),
    streakCalculator: StreakCalculator = new StreakCalculator(),
  ) {
    this.engine = engine;
    this.streakCalculator = streakCalculator;
  }

  public execute(input: ProcessCardReviewInput): ProcessCardReviewOutput {
    const { card, rating, now = new Date(), currentStreak } = input;

    // Ensure valid FSRS state
    const currentFSRS = ensureFSRSState(card, now);

    // Schedule using FSRS Engine
    const { card: nextFSRSState, log } = this.engine.scheduleCard(currentFSRS, rating, now);

    const updatedCard: CardEntity = {
      ...card,
      fsrs: nextFSRSState,
      lastReviewedAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    const earnedXP = this.streakCalculator.calculateXP(rating);

    let newStreak: StreakState | undefined;
    if (currentStreak) {
      newStreak = this.streakCalculator.updateStreak(currentStreak, now);
    }

    return {
      updatedCard,
      reviewLog: log,
      earnedXP,
      newStreak,
    };
  }
}
