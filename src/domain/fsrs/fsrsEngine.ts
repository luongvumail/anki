import { DEFAULT_FSRS_PARAMETERS } from './fsrsConstants';
import {
  FSRSCardState,
  FSRSItemScheduling,
  FSRSParameters,
  FSRSScheduleResult,
  Rating,
  ReviewLog,
  State,
} from './fsrsTypes';

/**
 * FSRS v5 Math & Scheduling Engine
 * Pure function implementations of Free Spaced Repetition Scheduler v5.
 */
export class FSRSEngine {
  private params: FSRSParameters;

  constructor(params: FSRSParameters = DEFAULT_FSRS_PARAMETERS) {
    this.params = params;
  }

  /**
   * Calculates Retrievability R(t, S) - predicted probability of recall after t days.
   */
  public calculateRetrievability(elapsedDays: number, stability: number): number {
    if (stability <= 0) return 0;
    if (elapsedDays <= 0) return 1.0;
    const r = Math.pow(1 + elapsedDays / (9 * stability), -1);
    return Math.min(1.0, Math.max(0.0, r));
  }

  /**
   * Calculates next interval given target retrievability and stability.
   */
  public calculateNextInterval(stability: number): number {
    const rTarget = this.params.request_retention;
    const maxInterval = this.params.maximum_interval;
    const intervalDays = 9 * stability * (1 / rTarget - 1);
    const rounded = Math.round(intervalDays);
    return Math.max(1, Math.min(maxInterval, rounded));
  }

  /**
   * Calculates initial stability for a brand new card.
   */
  private initInitialStability(rating: Rating): number {
    const w = this.params.w;
    switch (rating) {
      case Rating.Again:
        return Math.max(0.1, w[0]);
      case Rating.Hard:
        return Math.max(0.1, w[1]);
      case Rating.Good:
        return Math.max(0.1, w[2]);
      case Rating.Easy:
        return Math.max(0.1, w[3]);
      default:
        return w[2];
    }
  }

  /**
   * Calculates initial difficulty for a brand new card.
   */
  private initInitialDifficulty(rating: Rating): number {
    const w = this.params.w;
    const d0 = w[4] - Math.exp(w[5] * (rating - 1)) + 1;
    return this.clampDifficulty(d0);
  }

  /**
   * Updates difficulty value after review.
   */
  private updateDifficulty(currentD: number, rating: Rating): number {
    const w = this.params.w;
    const initD3 = w[4] - Math.exp(w[5] * (Rating.Good - 1)) + 1;
    const deltaD = currentD - w[6] * (rating - 3);
    const meanRevertedD = w[7] * initD3 + (1 - w[7]) * deltaD;
    return this.clampDifficulty(meanRevertedD);
  }

  /**
   * Updates stability after successful recall (Rating >= Good/Hard).
   */
  private nextRecallStability(
    d: number,
    s: number,
    r: number,
    rating: Rating
  ): number {
    const w = this.params.w;
    const hardPenalty = rating === Rating.Hard ? w[11] : 1.0;
    const easyBonus = rating === Rating.Easy ? w[12] : 1.0;
    const recallInc =
      1 +
      Math.exp(w[8]) *
        (11 - d) *
        Math.pow(s, -w[9]) *
        (Math.exp(w[10] * (1 - r)) - 1) *
        hardPenalty *
        easyBonus;
    return Math.max(0.1, s * recallInc);
  }

  /**
   * Updates stability after failure (Rating === Again).
   */
  private nextForgetStability(d: number, s: number, r: number): number {
    const w = this.params.w;
    const forgetStab =
      w[13] *
      Math.pow(d, -w[14]) *
      (Math.pow(s + 1, w[15]) - 1) *
      Math.exp(w[16] * (1 - r));
    return Math.max(0.1, forgetStab);
  }

  private clampDifficulty(d: number): number {
    return Math.min(10.0, Math.max(1.0, d));
  }

  /**
   * Generates initial card state for a brand new card.
   */
  public createEmptyCard(now: Date = new Date()): FSRSCardState {
    return {
      stability: 0,
      difficulty: 0,
      reps: 0,
      lapses: 0,
      state: State.New,
      last_review: null,
      due: now.toISOString(),
    };
  }

  /**
   * Schedules a card for a specific user rating.
   */
  public scheduleCard(
    card: FSRSCardState,
    rating: Rating,
    now: Date = new Date()
  ): FSRSItemScheduling {
    const isNew = card.state === State.New || card.last_review === null;
    const lastReviewDate = card.last_review ? new Date(card.last_review) : now;
    const elapsedDays = isNew
      ? 0
      : Math.max(0, (now.getTime() - lastReviewDate.getTime()) / (1000 * 3600 * 24));

    let nextStability: number;
    let nextDifficulty: number;
    let nextState: State;
    let lapses = card.lapses;

    if (isNew) {
      nextStability = this.initInitialStability(rating);
      nextDifficulty = this.initInitialDifficulty(rating);
      nextState = rating === Rating.Again ? State.Learning : State.Review;
      if (rating === Rating.Again) lapses += 1;
    } else {
      const currentR = this.calculateRetrievability(elapsedDays, card.stability);
      nextDifficulty = this.updateDifficulty(card.difficulty, rating);

      if (rating === Rating.Again) {
        nextStability = this.nextForgetStability(card.difficulty, card.stability, currentR);
        nextState = State.Relearning;
        lapses += 1;
      } else {
        nextStability = this.nextRecallStability(
          card.difficulty,
          card.stability,
          currentR,
          rating
        );
        nextState = State.Review;
      }
    }

    const scheduledDays =
      rating === Rating.Again ? 0 : this.calculateNextInterval(nextStability);

    const dueTime = new Date(now.getTime() + (scheduledDays === 0 ? 10 * 60 * 1000 : scheduledDays * 24 * 3600 * 1000));

    const nextCard: FSRSCardState = {
      stability: Number(nextStability.toFixed(4)),
      difficulty: Number(nextDifficulty.toFixed(4)),
      reps: card.reps + 1,
      lapses,
      state: nextState,
      last_review: now.toISOString(),
      due: dueTime.toISOString(),
    };

    const reviewLog: ReviewLog = {
      rating,
      state: card.state,
      due: card.due,
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      elapsed_days: Number(elapsedDays.toFixed(2)),
      scheduled_days: scheduledDays,
      review: now.toISOString(),
    };

    return { card: nextCard, log: reviewLog };
  }

  /**
   * Computes all 4 rating options (Again, Hard, Good, Easy) for a card preview/action buttons.
   */
  public repeatCard(card: FSRSCardState, now: Date = new Date()): FSRSScheduleResult {
    return {
      [Rating.Again]: this.scheduleCard(card, Rating.Again, now),
      [Rating.Hard]: this.scheduleCard(card, Rating.Hard, now),
      [Rating.Good]: this.scheduleCard(card, Rating.Good, now),
      [Rating.Easy]: this.scheduleCard(card, Rating.Easy, now),
    };
  }
}
